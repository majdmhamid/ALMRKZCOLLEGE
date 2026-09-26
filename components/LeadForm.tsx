"use client";

import { useState } from "react";
import { CheckIcon } from "./Icons";

type Props = {
  lang: string;
  courses: string[];
  labels: { name: string; phone: string; courseAny: string; submit: string; privacy: string; successTitle: string; successText: string; error: string };
};

export default function LeadForm({ lang, courses, labels }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, lang }) });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="form-success" role="status">
        <span className="form-success-icon">
          <CheckIcon />
        </span>
        <h3>{labels.successTitle}</h3>
        <p>{labels.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="lead-form">
      <input name="name" required autoComplete="name" placeholder={labels.name} aria-label={labels.name} />
      <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder={labels.phone} aria-label={labels.phone} />
      <select name="course" defaultValue="" aria-label={labels.courseAny}>
        <option value="">{labels.courseAny}</option>
        {courses.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button type="submit" disabled={state === "sending"}>
        {labels.submit}
      </button>
      {state === "error" && (
        <p className="form-error" role="alert">
          {labels.error}
        </p>
      )}
      <p className="form-privacy">{labels.privacy}</p>
    </form>
  );
}
