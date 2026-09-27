"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const ERRORS: Record<NonNullable<LoginState["error"]>, string> = {
  invalid: "الإيميل أو كلمة السر مش صحيحين.",
  not_admin: "هاد الحساب ما إله صلاحية على لوحة التحكم.",
  rateLimited: "محاولات كثيرة — استنى عشر دقايق وجرّب كمان مرة.",
};

export default function LoginForm({ demo }: { demo?: { email: string; password: string } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4 text-start">
      <label className="block">
        <span className="label">الإيميل</span>
        <input name="email" type="email" className="input" dir="ltr" autoComplete="username" required autoFocus defaultValue={demo?.email} />
      </label>
      <label className="block">
        <span className="label">كلمة السر</span>
        <input name="password" type="password" className="input" dir="ltr" autoComplete="current-password" required defaultValue={demo?.password} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {ERRORS[state.error]}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        <LogIn size={18} /> {pending ? "لحظة…" : "دخول"}
      </button>
    </form>
  );
}
