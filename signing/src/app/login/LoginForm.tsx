"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{t("email")}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          dir="ltr"
          className="h-11 w-full rounded-xl border border-line bg-white px-3 text-start outline-none focus:border-admin focus:ring-2 focus:ring-admin/20"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{t("password")}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="h-11 w-full rounded-xl border border-line bg-white px-3 text-start outline-none focus:border-admin focus:ring-2 focus:ring-admin/20"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(state.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-ink font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
      >
        {t("submit")}
      </button>
    </form>
  );
}
