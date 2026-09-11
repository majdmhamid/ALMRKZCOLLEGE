import Image from "next/image";
import Link from "next/link";
import { site } from "@content/site";
import type { Dictionary } from "@content/i18n";
import { href, type Locale } from "@/lib/i18n";
import { FacebookIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon, YouTubeIcon } from "./Icons";

interface Props {
  locale: Locale;
  dict: Dictionary;
  groups: { slug: string; name: string }[];
}

export default function Footer({ locale, dict, groups }: Props) {
  const year = new Date().getFullYear();
  const quick = [
    { to: href(locale, "/courses"), label: dict.nav.courses },
    { to: href(locale, "/about"), label: dict.nav.about },
    { to: href(locale, "/graduates"), label: dict.nav.graduates },
    { to: href(locale, "/gallery"), label: dict.nav.gallery },
    { to: href(locale, "/news"), label: dict.nav.news },
    { to: href(locale, "/employers"), label: dict.nav.employers },
    { to: href(locale, "/contact"), label: dict.nav.contact },
  ];
  return (
    <footer className="mt-auto bg-brand-900 text-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/images/brand/logo-white.png" alt={site.name[locale]} width={200} height={83} className="h-16 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-white/80">{dict.footer.aboutText}</p>
          <div className="mt-4 flex gap-2">
            <a href={site.social.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
              <FacebookIcon />
            </a>
            <a href={site.social.youtube} target="_blank" rel="noopener" aria-label="YouTube" className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
              <YouTubeIcon />
            </a>
            <a href={site.whatsappUrl} target="_blank" rel="noopener" aria-label="WhatsApp" className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold">{dict.footer.quickLinks}</h3>
          <ul className="space-y-2 text-white/85">
            {quick.map((q) => (
              <li key={q.to}>
                <Link href={q.to} className="hover:text-brand-300 hover:underline">
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold">{dict.footer.coursesTitle}</h3>
          <ul className="space-y-2 text-white/85">
            {groups.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/courses/${g.slug}`)} className="hover:text-brand-300 hover:underline">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold">{dict.footer.contactTitle}</h3>
          <ul className="space-y-3 text-white/85">
            <li className="flex items-start gap-2">
              <PinIcon className="mt-1 shrink-0" />
              <span>{site.address[locale]}</span>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="shrink-0" />
              <a href={`tel:${site.phoneIntl}`} dir="ltr" className="hover:underline">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <WhatsAppIcon className="shrink-0" />
              <a href={site.whatsappUrl} target="_blank" rel="noopener" dir="ltr" className="hover:underline">
                {site.mobile}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="shrink-0" />
              <a href={`mailto:${site.email}`} dir="ltr" className="break-all hover:underline">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-sm text-white/70 md:flex-row">
          <p>
            © {year} {site.name[locale]} · {dict.footer.rights}
          </p>
          <Link href={href(locale, "/accessibility")} className="hover:text-white hover:underline">
            {dict.footer.accessibility}
          </Link>
        </div>
      </div>
    </footer>
  );
}
