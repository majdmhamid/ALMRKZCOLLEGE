"use client";

import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "blue" | "orange" | "green" | "red" | "purple";

const toneClasses: Record<Tone, string> = {
  neutral: "text-slate-600 hover:bg-slate-100 hover:text-ink border-line bg-card",
  blue: "text-admin bg-blue-50 hover:bg-blue-100 border-blue-200",
  orange: "text-waiting bg-orange-50 hover:bg-orange-100 border-orange-200",
  green: "text-signed bg-green-50 hover:bg-green-100 border-green-200",
  red: "text-red-600 bg-card hover:bg-red-50 border-line hover:border-red-200",
  purple: "text-final bg-violet-50 hover:bg-violet-100 border-violet-200",
};

/** Round icon button with an accessible label and a native tooltip. */
export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  size = "md",
  className = "",
  ...rest
}: { icon: LucideIcon; label: string; tone?: Tone; size?: "sm" | "md" } & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid shrink-0 place-items-center rounded-full border transition-colors disabled:opacity-40 ${
        size === "sm" ? "size-8" : "size-9"
      } ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      <Icon className={size === "sm" ? "size-4" : "size-[18px]"} strokeWidth={2} />
    </button>
  );
}

export function Button({
  variant = "secondary",
  icon: Icon,
  children,
  className = "",
  ...rest
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: LucideIcon;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 border-transparent",
    secondary: "bg-card text-ink hover:bg-slate-50 border-line",
    danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
    ghost: "bg-transparent text-muted hover:text-ink hover:bg-slate-100 border-transparent",
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="size-4" strokeWidth={2.25} />}
      {children}
    </button>
  );
}
