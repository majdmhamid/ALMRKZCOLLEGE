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

/** التذييل بنسخة فاتحة: خلفية فاتحة ونصوص داكنة، وشريط أخضر غامق رفيع في الأسفل فقط */
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
  const social = "flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-brand-700 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50";
  return (
    <footer className="mt-auto border-t-4 border-brand-500 bg-surface text-ink">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/images/brand/logo.png" alt={site.name[locale]} width={200} height={50} className="h-12 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{dict.footer.aboutText}</p>
          <div className="mt-4 flex gap-2">
            <a href={site.social.facebook} target="_blank" rel="noopener" aria-label="Facebook" className={social}>
              <FacebookIcon />
            </a>
            <a href={site.social.youtube} target="_blank" rel="noopener" aria-label="YouTube" className={social}>
              <YouTubeIcon />
            </a>
            <a href={site.whatsappUrl} target="_blank" rel="noopener" aria-label="WhatsApp" className={social}>
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold text-brand-800">{dict.footer.quickLinks}</h3>
          <ul className="space-y-2 text-ink-soft">
            {quick.map((q) => (
              <li key={q.to}>
                <Link href={q.to} className="transition hover:text-brand-700 hover:underline">
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold text-brand-800">{dict.footer.coursesTitle}</h3>
          <ul className="space-y-2 text-ink-soft">
            {groups.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/courses/${g.slug}`)} className="transition hover:text-brand-700 hover:underline">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold text-brand-800">{dict.footer.contactTitle}</h3>
          <ul className="space-y-3 text-ink-soft">
            <li className="flex items-start gap-2">
              <PinIcon className="mt-1 shrink-0 text-brand-600" />
              <span>{site.address[locale]}</span>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="shrink-0 text-brand-600" />
              <a href={`tel:${site.phoneIntl}`} dir="ltr" className="hover:underline">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <WhatsAppIcon className="shrink-0 text-brand-600" />
              <a href={site.whatsappUrl} target="_blank" rel="noopener" dir="ltr" className="hover:underline">
                {site.mobile}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="shrink-0 text-brand-600" />
              <a href={`mailto:${site.email}`} dir="ltr" className="break-all hover:underline">
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="bg-brand-800 text-white/85">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-sm md:flex-row">
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
