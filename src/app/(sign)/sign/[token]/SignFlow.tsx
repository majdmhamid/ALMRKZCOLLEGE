"use client";

import { CheckCircle2, FileSignature, Link2Off, Lock, PenLine, ShieldCheck, Type, UserCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { LanguageSwitch } from "@/features/signing/components/LanguageSwitch";
import { PdfPage, useElementWidth, usePdfDocument } from "@/features/signing/components/pdf/PdfView";
import { SignaturePad, textSignatureDataUrl, type SignaturePadHandle } from "@/features/signing/components/signature/SignaturePad";
import type { SignatureMethod } from "@/features/signing/lib/domain";
import type { SignView } from "@/features/signing/server/services/signing";
import { signAnotherAction, submitSignatureAction, verifyIdAction } from "./actions";

export function SignFlow({ token, view }: { token: string; view: SignView }) {
  const t = useTranslations("sign");
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
              <FileSignature className="size-4" />
            </span>
            {t("title")}
          </div>
          <LanguageSwitch />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5 pb-32">
        {done ? (
          <Message icon={CheckCircle2} tone="green" title={t("doneTitle")} body={t("doneBody")} />
        ) : view.state === "invalid" ? (
          <Message icon={Link2Off} tone="slate" title={t("title")} body={t("invalidLink")} />
        ) : view.state === "closed" ? (
          <Message icon={Lock} tone="slate" title={t("closedTitle")} body={t("closed")} doc={view.title} />
        ) : view.state === "locked" ? (
          <Message icon={Lock} tone="red" title={t("lockedTitle")} body={t("locked")} doc={view.title} />
        ) : view.state === "already_signed" ? (
          <AlreadySigned token={token} title={view.title} canSignAnother={view.canSignAnother} />
        ) : (
          <>
            <DocIntro title={view.title} description={view.description} signerName={view.signerName} />
            <Steps current={view.state === "verify" ? 0 : 1} />
            {view.state === "verify" ? (
              <VerifyStep token={token} mode={view.mode} />
            ) : (
              <SignStep token={token} view={view} onDone={() => setDone(true)} />
            )}
          </>
        )}
        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="size-3.5" />
          {t("secure")}
        </p>
      </main>
    </div>
  );
}

function DocIntro({ title, description, signerName }: { title: string; description: string | null; signerName: string | null }) {
  const t = useTranslations("sign");
  return (
    <section className="mb-5 rounded-2xl border border-line bg-card p-5 shadow-card">
      {signerName && <p className="mb-1 text-sm font-medium text-slate-600">{t("hello", { name: signerName })}</p>}
      <p className="text-sm text-muted">{t("invitedTo")}</p>
      <h1 className="mt-1 text-xl font-bold leading-snug">{title}</h1>
      {description && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{description}</p>}
    </section>
  );
}

function Steps({ current }: { current: number }) {
  const t = useTranslations("sign");
  const labels = [t("stepVerify"), t("stepRead"), t("stepSign")];
  return (
    <ol className="mb-5 flex items-center gap-2 text-xs font-semibold">
      {labels.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full ${
              i < current ? "bg-signed text-white" : i === current ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </span>
          <span className={i === current ? "text-ink" : "text-muted"}>{label}</span>
          {i < labels.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
        </li>
      ))}
    </ol>
  );
}

function Message({
  icon: Icon,
  tone,
  title,
  body,
  doc,
  children,
}: {
  icon: typeof Lock;
  tone: "green" | "red" | "slate";
  title: string;
  body: string;
  doc?: string;
  children?: React.ReactNode;
}) {
  const colors = { green: "bg-green-100 text-signed", red: "bg-red-100 text-red-600", slate: "bg-slate-100 text-slate-500" }[tone];
  return (
    <section data-testid="sign-message" className="mt-6 rounded-3xl border border-line bg-card px-6 py-10 text-center shadow-card">
      <span className={`mx-auto mb-4 grid size-16 place-items-center rounded-full ${colors}`}>
        <Icon className="size-8" />
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      {doc && <p className="mt-1 text-sm font-medium text-slate-600">{doc}</p>}
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {children}
    </section>
  );
}

function AlreadySigned({ token, title, canSignAnother }: { token: string; title: string; canSignAnother: boolean }) {
  const t = useTranslations("sign");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Message icon={CheckCircle2} tone="green" title={t("alreadySignedTitle")} body={t("alreadySigned")} doc={title}>
      {canSignAnother && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await signAnotherAction(token);
              router.refresh();
            })
          }
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <UserCheck className="size-4" />
          {t("signAnother")}
        </button>
      )}
    </Message>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — ID check
// ---------------------------------------------------------------------------

const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30";

/** Link to the website's privacy policy, e-signature section, in the page's language. */
function PrivacyLink() {
  const t = useTranslations("sign");
  const locale = useLocale() === "he" ? "he" : "ar";
  return (
    <a href={`/${locale}/privacy#esign`} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline underline-offset-2">
      {t("privacyLink")}
    </a>
  );
}

function VerifyStep({ token, mode }: { token: string; mode: "per_signer" | "shared" }) {
  const t = useTranslations("sign");
  const router = useRouter();
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hintId = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await verifyIdAction(token, { idNumber, name: mode === "shared" ? name : undefined }).catch(() => ({
        error: "generic" as const,
        attemptsLeft: undefined,
      }));
      if ("ok" in result && result.ok) {
        router.refresh();
        return;
      }
      const code = result.error ?? "generic";
      if (code === "locked" || code === "closed" || (code === "already_signed" && mode === "per_signer")) router.refresh();
      setError(t(`errors.${code}`, { n: result.attemptsLeft ?? 0 }));
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <h2 className="text-lg font-bold">{t("verifyTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{mode === "shared" ? t("verifyShared") : t("verifyPerSigner")}</p>
      <div className="space-y-4">
        {mode === "shared" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">{t("nameLabel")}</span>
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t("idLabel")}</span>
          <input
            required
            inputMode="numeric"
            pattern="[0-9 \-]*"
            maxLength={11}
            autoComplete="off"
            dir="ltr"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value.replace(/[^\d\- ]/g, ""))}
            className={`${inputClass} text-end text-lg tracking-widest`}
            aria-describedby={hintId}
            aria-invalid={error ? true : undefined}
          />
          <span id={hintId} className="mt-1 block text-xs text-muted">{t("idHint")}</span>
        </label>
      </div>
      {/* Privacy notice before the ID number (חוק הגנת הפרטיות, סעיף 11): why, where it goes, no duty. */}
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        {t("idNotice")} <PrivacyLink />
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-12 w-full rounded-xl bg-brand-600 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? t("checking") : t("continue")}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Steps 2 + 3 — read, then sign
// ---------------------------------------------------------------------------

function SignStep({
  token,
  view,
  onDone,
}: {
  token: string;
  view: Extract<SignView, { state: "sign" }>;
  onDone: () => void;
}) {
  const t = useTranslations("sign");
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const pdf = usePdfDocument(pdfUrl);
  const [boxRef, width] = useElementWidth<HTMLDivElement>();

  const [read, setRead] = useState(false);
  // חוק חתימה אלקטרונית: the signer agrees to sign electronically, separately from "I read it".
  const [esign, setEsign] = useState(false);
  const [method, setMethod] = useState<SignatureMethod>("draw");
  const [padEmpty, setPadEmpty] = useState(true);
  const [typed, setTyped] = useState(view.signerName);
  const [checkboxOk, setCheckboxOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pad = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    fetch(`/sign/${token}/document`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { url: string }) => setPdfUrl(d.url))
      .catch(() => setUrlError(true));
  }, [token]);

  const methods: { id: SignatureMethod; label: string; icon: typeof PenLine }[] = [
    { id: "draw", label: t("methodDraw"), icon: PenLine },
    ...(view.methods.typed ? [{ id: "typed" as const, label: t("methodTyped"), icon: Type }] : []),
    ...(view.methods.checkbox ? [{ id: "checkbox" as const, label: t("methodCheckbox"), icon: UserCheck }] : []),
  ];

  const hasSignature =
    method === "draw" ? !padEmpty : method === "typed" ? typed.trim().length >= 2 : checkboxOk && typed.trim().length >= 2;

  const submit = () => {
    setError(null);
    if (!read) return setError(t("needRead"));
    if (!esign) return setError(t("needEsign"));
    if (!hasSignature) return setError(t("needSignature"));
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const dataUrl =
      method === "draw"
        ? pad.current?.toDataUrl()
        : textSignatureDataUrl(typed.trim(), { check: method === "checkbox", fontFamily });
    if (!dataUrl) return setError(t("needSignature"));
    startTransition(async () => {
      const result = await submitSignatureAction(token, { method, dataUrl, readConfirmed: true, esignConsent: true }).catch(() => ({
        error: "generic" as const,
      }));
      if ("ok" in result && result.ok) {
        window.scrollTo({ top: 0 });
        onDone();
        return;
      }
      const code = result.error ?? "generic";
      if (code === "session" || code === "already_signed" || code === "closed" || code === "invalid_link") router.refresh();
      setError(t(`errors.${code}`, { n: 0 }));
    });
  };

  return (
    <>
      <section className="mb-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t("readTitle")}</h2>
          <span className="text-xs text-muted">{t("pages", { n: view.pageCount })}</span>
        </div>
        <div
          ref={boxRef}
          data-testid="pdf-viewer"
          tabIndex={0}
          role="region"
          aria-label={t("readTitle")}
          className="max-h-[70dvh] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-slate-200/60 p-2"
        >
          {urlError || pdf.status === "error" ? (
            <p className="p-8 text-center text-sm text-red-600">{t("loadError")}</p>
          ) : pdf.status !== "ready" || width === 0 ? (
            <p role="status" className="p-8 text-center text-sm text-muted">{t("loading")}</p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {pdf.sizes.map((size, i) => (
                <PdfPage key={i} doc={pdf.doc} pageNumber={i + 1} size={size} width={width - 16} eager={i === 0} />
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted">{t("scrollHint")}</p>
      </section>

      <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
        <input
          type="checkbox"
          checked={read}
          onChange={(e) => setRead(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-brand-600"
          data-testid="read-confirm"
        />
        <span className="text-sm font-medium leading-relaxed">{t("readConfirm")}</span>
      </label>

      {/* What an electronic signature means (חוק חתימה אלקטרונית 2001) + the signer's separate consent. */}
      <section className="mb-5 rounded-2xl border border-line bg-card p-4 shadow-card">
        <p className="text-xs leading-relaxed text-slate-600">
          {t("esignInfo")} <PrivacyLink />
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={esign}
            onChange={(e) => setEsign(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-brand-600"
            data-testid="esign-consent"
          />
          <span className="text-sm font-medium leading-relaxed">{t("esignConsent")}</span>
        </label>
      </section>

      <section className={`rounded-2xl border bg-card p-4 shadow-card ${read ? "border-line" : "border-dashed border-slate-300"}`}>
        <h2 className="mb-3 text-lg font-bold">{t("signTitle")}</h2>
        {!read && <p className="mb-3 text-sm text-muted">{t("needRead")}</p>}
        {methods.length > 1 && (
          <div role="tablist" className="mb-3 grid gap-1 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${methods.length}, 1fr)` }}>
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={method === m.id}
                onClick={() => setMethod(m.id)}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${
                  method === m.id ? "bg-card text-ink shadow-card" : "text-muted"
                }`}
              >
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>
        )}

        <fieldset disabled={!read} className="contents">
          {method === "draw" ? (
            <SignaturePad ref={pad} onChange={setPadEmpty} hint={t("drawHint")} clearLabel={t("clear")} />
          ) : (
            <div className="space-y-3">
              {method === "checkbox" && (
                <label className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <input type="checkbox" checked={checkboxOk} onChange={(e) => setCheckboxOk(e.target.checked)} className="size-5 accent-brand-600" />
                  <span className="text-sm font-medium">{t("checkboxLabel")}</span>
                </label>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">{t("typedLabel")}</span>
                <input value={typed} maxLength={80} onChange={(e) => setTyped(e.target.value)} className={inputClass} />
              </label>
              {typed.trim() && (
                <div className="grid h-24 place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-3xl font-semibold italic text-blue-900">
                  {method === "checkbox" ? `☑ ${typed}` : typed}
                </div>
              )}
            </div>
          )}
        </fieldset>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
          {error && (
            <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            data-testid="submit-signature"
            className={`h-13 w-full rounded-xl text-base font-bold text-white transition disabled:opacity-60 ${
              read && esign && hasSignature ? "bg-signed hover:bg-green-700" : "bg-slate-500"
            }`}
          >
            {pending ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </>
  );
}
