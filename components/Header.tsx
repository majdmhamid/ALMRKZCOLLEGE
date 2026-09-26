"use client";

import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, PhoneIcon, WhatsAppIcon } from "./Icons";

type Props = {
  logoAlt: string;
  links: { href: string; label: string }[];
  otherLang: { href: string; label: string };
  phone: string;
  telHref: string;
  waHref: string;
  labels: { whatsapp: string; menu: string; close: string };
};

export default function Header({ logoAlt, links, otherLang, phone, telHref, waHref, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the reader on the same section when switching language.
  const switchLang = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.assign(otherLang.href + window.location.hash);
  };

  return (
    <header className="site-header">
      <div className="glass header-bar">
        <a href="#top" className="header-logo">
          <img src="/assets/brand/logo.png" alt={logoAlt} width={151} height={38} />
        </a>
        <nav className="header-nav desktop-only" aria-label={labels.menu}>
          {links.map((m) => (
            <a key={m.href} href={m.href}>
              {m.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a href={otherLang.href} onClick={switchLang} className="btn-lang" hrefLang={otherLang.href.slice(1)}>
            {otherLang.label}
          </a>
          <a href={telHref} className="btn-header-call desktop-only">
            <PhoneIcon />
            <span dir="ltr">{phone}</span>
          </a>
          <a href={waHref} target="_blank" rel="noopener" className="btn-header-wa desktop-only">
            <WhatsAppIcon />
            {labels.whatsapp}
          </a>
          <button
            type="button"
            className="btn-menu mobile-only"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? labels.close : labels.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="glass mobile-menu mobile-only">
          <nav>
            {links.map((m, i) => (
              <a key={m.href} href={m.href} onClick={() => setOpen(false)}>
                <span>{m.label}</span>
                <span className="mobile-menu-n">{String(i + 1).padStart(2, "0")}</span>
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
