"use client";

import { ClipboardCopy, KeyRound, Link2Off, Lock, MessageCircle, RefreshCw, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getShareInfoAction,
  recordLinkCopiedAction,
  regenerateLinkAction,
  resetLockAction,
  revokeLinkAction,
} from "@/features/signing/actions/documents";
import { Dialog } from "@/features/signing/components/ui/Dialog";
import { useToast } from "@/features/signing/components/ui/Toast";
import { copyText } from "@/features/signing/lib/clipboard";
import { formatPhone } from "@/features/signing/lib/phone";
import { whatsappUrl } from "@/features/signing/lib/share";
import type { ShareInfo, ShareLink } from "@/features/signing/server/services/links";

/**
 * Per-signer: one row per signer with copy + WhatsApp. Shared: one link.
 * Opened from the orange clipboard button. `initial` lets the caller pass data it
 * already fetched (to copy on the same click).
 */
export function ShareDialog({
  documentId,
  initial,
  onClose,
}: {
  documentId: string | null;
  initial: ShareInfo | null;
  onClose: () => void;
}) {
  const t = useTranslations("share");
  const [info, setInfo] = useState<ShareInfo | null>(initial);

  const reload = useCallback(async () => {
    if (documentId) setInfo(await getShareInfoAction(documentId));
  }, [documentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show what the caller already has, then refresh
    setInfo(initial);
    if (documentId && !initial) void reload();
  }, [documentId, initial, reload]);

  return (
    <Dialog open={!!documentId} onClose={onClose} title={info ? `${t("title")} · ${info.title}` : t("title")} size="lg">
      {!info ? (
        <div className="py-10 text-center text-sm text-muted">…</div>
      ) : (
        <div className="space-y-3">
          {info.finalized && (
            <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-final">{t("finalized")}</p>
          )}
          {info.links.map((link) => (
            <LinkRow key={link.signerId ?? "shared"} info={info} link={link} onChanged={reload} />
          ))}
          <p className="pt-1 text-xs leading-relaxed text-muted">{t("hint")}</p>
        </div>
      )}
    </Dialog>
  );
}

function LinkRow({ info, link, onChanged }: { info: ShareInfo; link: ShareLink; onChanged: () => Promise<void> }) {
  const t = useTranslations("share");
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const ref = { documentId: info.documentId, signerId: link.signerId };
  const signed = link.status === "signed";

  const run = (action: typeof revokeLinkAction, message: string) =>
    startTransition(async () => {
      const result = await action(ref);
      if (result.ok) toast(message);
      else toast(t("copyFailed"), "error");
      await onChanged();
    });

  return (
    <div data-testid="share-row" className="rounded-2xl border border-line p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{link.name ?? t("sharedLink")}</span>
        {link.phone ? (
          <span dir="ltr" className="text-sm text-muted">
            {formatPhone(link.phone)}
          </span>
        ) : (
          link.signerId && <span className="text-xs text-muted">{t("noPhone")}</span>
        )}
        {link.status && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              signed ? "bg-green-50 text-signed" : link.locked ? "bg-red-50 text-red-600" : "bg-orange-50 text-waiting"
            }`}
          >
            {signed ? t("signed") : link.locked ? t("locked", { n: link.failedAttempts }) : t("pending")}
          </span>
        )}
        {!signed && !link.locked && link.failedAttempts > 0 && (
          <span className="text-xs text-red-600">{t("attempts", { n: link.failedAttempts })}</span>
        )}
      </div>

      {!signed && !info.finalized && (
        <>
          {link.url ? (
            <input
              readOnly
              value={link.url}
              dir="ltr"
              aria-label={`${t("title")} — ${link.name ?? t("sharedLink")}`}
              onFocus={(e) => e.target.select()}
              className="mb-3 h-9 w-full truncate rounded-lg border border-line bg-slate-50 px-3 font-mono text-xs text-slate-600"
            />
          ) : (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-muted">
              <Link2Off className="size-4" />
              {t("noLink")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {link.message && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(link.message!);
                    toast(ok ? t("copied") : t("copyFailed"), ok ? "ok" : "error");
                    if (ok) void recordLinkCopiedAction(ref);
                  }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-waiting px-4 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <ClipboardCopy className="size-4" />
                  {t("copy")}
                </button>
                <a
                  href={whatsappUrl(link.message, link.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void recordLinkCopiedAction(ref)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
                >
                  <MessageCircle className="size-4" />
                  {t("whatsapp")}
                </a>
              </>
            )}
            <span className="ms-auto flex flex-wrap gap-2">
              {(link.locked || (!link.signerId && info.lockedDevices > 0)) && (
                <SmallButton icon={Unlock} disabled={pending} onClick={() => run(resetLockAction, t("unlocked"))}>
                  {link.signerId ? t("unlock") : t("unlockDevices", { n: info.lockedDevices })}
                </SmallButton>
              )}
              <SmallButton icon={link.url ? RefreshCw : KeyRound} disabled={pending} onClick={() => run(regenerateLinkAction, t("regenerated"))}>
                {t("regenerate")}
              </SmallButton>
              {link.url && (
                <SmallButton
                  icon={Lock}
                  danger
                  disabled={pending}
                  onClick={() => window.confirm(t("confirmRevoke")) && run(revokeLinkAction, t("revoked"))}
                >
                  {t("revoke")}
                </SmallButton>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function SmallButton({
  icon: Icon,
  danger,
  children,
  ...rest
}: { icon: typeof Lock; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium disabled:opacity-50 ${
        danger ? "border-line text-red-600 hover:bg-red-50" : "border-line text-slate-700 hover:bg-slate-50"
      }`}
      {...rest}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}
