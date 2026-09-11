"use client";

import { useActionState } from "react";
import { site } from "@content/site";
import type { Dictionary } from "@content/i18n";
import { submitLead, type LeadState } from "@/app/actions/lead";
import type { Locale } from "@/lib/i18n";
import { CheckIcon, WhatsAppIcon } from "./Icons";

interface Props {
  locale: Locale;
  dict: Dictionary["form"];
  whatsappLabel: string;
  courses: { value: string; label: string }[];
  defaultCourse?: string;
  /** من أي صفحة أُرسل الطلب (للتتبع فقط) */
  source: string;
  /** حقل "اسم الشركة" لصفحة الشركات */
  companyLabel?: string;
  compact?: boolean;
}

const initial: LeadState = { status: "idle" };

export default function LeadForm({ locale, dict, whatsappLabel, courses, defaultCourse, source, companyLabel, compact }: Props) {
  const [state, action, pending] = useActionState(submitLead, initial);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center" role="status">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
          <CheckIcon width={26} height={26} />
        </div>
        <h3 className="text-xl font-extrabold">{dict.successTitle}</h3>
        <p className="mt-2 text-ink-soft">{dict.successText}</p>
        <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp mt-4">
          <WhatsAppIcon />
          {whatsappLabel}
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      {/* مصيدة روبوتات — مخفية عن البشر */}
      <div className="hidden" aria-hidden="true">
        <label>
          website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label htmlFor={`${source}-name`} className="label">
            {dict.name} <span className="text-red-600">*</span>
          </label>
          <input id={`${source}-name`} name="name" required autoComplete="name" className="input" aria-invalid={!!state.fieldErrors?.name} />
          {state.fieldErrors?.name && <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor={`${source}-phone`} className="label">
            {dict.phone} <span className="text-red-600">*</span>
          </label>
          <input id={`${source}-phone`} name="phone" type="tel" required autoComplete="tel" inputMode="tel" dir="ltr" className="input text-start" aria-invalid={!!state.fieldErrors?.phone} />
          {state.fieldErrors?.phone && <p className="mt-1 text-sm text-red-600">{state.fieldErrors.phone}</p>}
        </div>
        {companyLabel && (
          <div className="sm:col-span-2">
            <label htmlFor={`${source}-company`} className="label">
              {companyLabel}
            </label>
            <input id={`${source}-company`} name="company" autoComplete="organization" className="input" />
          </div>
        )}
        <div>
          <label htmlFor={`${source}-course`} className="label">
            {dict.course}
          </label>
          <select id={`${source}-course`} name="course" defaultValue={defaultCourse ?? ""} className="input">
            <option value="" disabled>
              {dict.courseSelect}
            </option>
            <option value="any">{dict.courseAny}</option>
            {courses.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${source}-email`} className="label">
            {dict.email}
          </label>
          <input id={`${source}-email`} name="email" type="email" autoComplete="email" dir="ltr" className="input text-start" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${source}-message`} className="label">
            {dict.message}
          </label>
          <textarea id={`${source}-message`} name="message" rows={3} className="input" />
        </div>
      </div>

      {state.status === "error" && !state.fieldErrors && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message || dict.errorGeneric}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg disabled:opacity-60">
          {pending ? dict.sending : dict.submit}
        </button>
        <a href={site.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp">
          <WhatsAppIcon />
          {whatsappLabel}
        </a>
      </div>
      <p className="text-xs text-ink-muted">{dict.privacy}</p>
    </form>
  );
}
