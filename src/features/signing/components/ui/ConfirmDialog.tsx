"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "./buttons";
import { Dialog } from "./Dialog";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const t = useTranslations("common");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body && <div className="text-sm text-slate-600">{body}</div>}
    </Dialog>
  );
}
