"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const items = [
  { href: "/admin/documents", key: "documents", icon: "📄" },
  { href: "/admin/signed", key: "signed", icon: "✅" },
  { href: "/admin/settings", key: "settings", icon: "⚙️" },
] as const;

export function AdminNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 lg:flex-col">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors ${
              active ? "bg-brand-600 text-white" : "text-muted hover:bg-slate-100 hover:text-ink"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
