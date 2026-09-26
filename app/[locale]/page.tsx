import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import Header from "@/components/Header";
import HeroVideo from "@/components/HeroVideo";
import { ArrowIcon, FacebookIcon, InfoIcon, LayersIcon, PhoneIcon, PlayIcon, WhatsAppIcon, YouTubeIcon } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import PromoVideo from "@/components/PromoVideo";
import RevealObserver from "@/components/RevealObserver";
import Starts from "@/components/Starts";
import { forLocale, hero, isLocale, showStartDates, telHref, waHref } from "@/content";

const delay = (i: number, step: number) => ({ "--d": `${i * step}ms` }) as React.CSSProperties;

/** Numbered section kicker: "01 —— Courses". */
function Kicker({ n, label, light, center }: { n: string; label: string; light?: boolean; center?: boolean }) {
  return (
    <div className={`kicker${light ? " kicker-light" : ""}${center ? " kicker-center" : ""}`}>
      <span>{n}</span>
      <span className="kicker-line" />
      <span className="kicker-label">{label}</span>
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const C = forLocale(locale);
  const { d, x, site } = C;
  const other = locale === "he" ? "ar" : "he";
  const wa = waHref();

  return (
    <div className="page">
      <RevealObserver />
      <Header
        logoAlt={site.name}
        links={C.menuLinks}
        otherLang={{ href: `/${other}`, label: d.otherLang }}
        phone={site.phone}
        telHref={telHref}
        waHref={wa}
        labels={{ whatsapp: d.common.whatsapp, menu: d.nav.menu, close: d.nav.close }}
      />

      <main id="top">
        {/* Hero: workshop video + logo disc + college name */}
        <section className="hero">
          <div className="hero-bg" aria-hidden>
            <img src={hero.poster} alt="" className="cover hero-poster" fetchPriority="high" />
            <HeroVideo src={hero.video} poster={hero.poster} />
            <div className="hero-shade" />
            <div className="hero-grid" />
          </div>
          <div className="hero-inner">
            <div className="logo-disc">
              <span className="logo-disc-glow" aria-hidden />
              <span className="logo-disc-dash" aria-hidden />
              <span className="logo-disc-arc" aria-hidden />
              <span className="logo-disc-orbit" aria-hidden>
                <span />
              </span>
              <div className="logo-disc-face">
                <img src="/assets/brand/logo.png" alt={site.name} width={250} height={63} />
              </div>
            </div>
            <p className="hero-name">{site.name}</p>
            <div className="hero-copy">
              <h1 className="hero-slogan">
                {x.heroTitle} <span>{x.heroTitle2}</span>
              </h1>
              <p className="hero-text">{x.heroText}</p>
              <div className="hero-ctas">
                <a href={telHref} className="btn-hero-call">
                  <PhoneIcon size={22} strokeWidth={2.2} />
                  {x.callUs}
                </a>
                <a href={wa} target="_blank" rel="noopener" className="btn-hero-wa ring">
                  <WhatsAppIcon size={22} />
                  {d.common.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trade picker, overlapping the hero */}
        <section id="fields" className="trades">
          <div className="container">
            <p className="trades-title">
              <span />
              {x.pickTrade}
            </p>
            <div className="grid-trades">
              {C.groups.map((g) => (
                <a key={g.slug} href="#starts" className="glass lift zoom trade-card">
                  <div className="trade-media">
                    <img src={g.image} alt="" className="cover" />
                    <div className="trade-shade" />
                    <span className="trade-name">{g.name}</span>
                    <span className="trade-icon">
                      <img src={g.icon} alt="" width={30} height={30} />
                    </span>
                  </div>
                  <div className="trade-body">
                    <div>
                      <p className="trade-tagline">{g.tagline}</p>
                      <div className="trade-chips">
                        <span className="chip-soft">{g.countLabel}</span>
                        {showStartDates && (
                          <span className="chip-next">
                            <span className="blink-dot" />
                            {x.nextStart}: {g.nextLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowIcon size={24} strokeWidth={2.2} color="#158942" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Funding band */}
        <section id="funding" className="section-funding">
          <div data-reveal className="funding">
            <div className="funding-dots" aria-hidden />
            <div className="funding-inner">
              <div className="funding-main">
                <span className="funding-logo">
                  <img src="/assets/partners/ministry-of-labor.png" alt="" />
                </span>
                <div>
                  <h2>{x.fundTitle}</h2>
                  <p>{x.fundText}</p>
                </div>
              </div>
              <div className="funding-cta">
                <a href={waHref(x.fundMsg)} target="_blank" rel="noopener" className="btn-fund">
                  <WhatsAppIcon size={22} />
                  {x.fundCta}
                </a>
                <span>{x.fundNote}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming intakes */}
        <section id="starts" className="section section-starts">
          <div className="container">
            <Starts
              rows={C.courseRows}
              filters={[{ id: "all", label: x.all }, ...C.groups.map((g) => ({ id: g.slug, label: g.short }))]}
              showDates={showStartDates}
              labels={{ hours: d.common.hours, sessions: d.common.sessions, details: x.details }}
            >
              <div>
                <Kicker n="01" label={d.nav.courses} />
                <h2 className="h-section">{x.startsTitle}</h2>
                <p className="section-sub">{x.startsSub}</p>
              </div>
            </Starts>
            <p data-reveal className="dates-note">
              <InfoIcon color="#158942" style={{ flexShrink: 0, marginTop: 2 }} />
              {x.datesNote}
            </p>
          </div>
        </section>

        {/* Proof: recognition + graduates */}
        <section id="graduates" className="section section-proof">
          <div className="container">
            <div data-reveal className="proof-head">
              <div>
                <Kicker n="02" label={d.nav.graduates} />
                <h2 className="h-section">{x.proofTitle}</h2>
                <p className="section-sub">{x.proofSub}</p>
              </div>
              <div className="recog">
                <span>{x.recog}</span>
                {C.partners.slice(0, 2).map((p) => (
                  <div key={p.slug} className="recog-badge">
                    <img src={p.image} alt={p.name} />
                  </div>
                ))}
              </div>
            </div>
            <div className="snap">
              {C.graduates.map((g, i) => (
                <div key={g.slug} data-reveal className="lift grad" style={delay(i, 60)}>
                  <div className="zoom grad-card">
                    <img src={g.image} alt={g.name} loading="lazy" decoding="async" className="cover" />
                    <div className="grad-shade" />
                    <div className="grad-caption">
                      <p className="grad-name">{g.name}</p>
                      <p className="grad-course">{g.courseName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why + staff */}
        <section id="why" className="section-why">
          <div className="why-pattern" aria-hidden />
          <div className="container why-grid">
            <div>
              <div data-reveal>
                <Kicker n="03" label={d.nav.about} />
              </div>
              <h2 data-reveal className="h-section">
                {d.home.whyTitle}
              </h2>
              <div className="why-list">
                {d.home.whyItems.map((w, i) => (
                  <div key={w.title} data-reveal className="glass why-item" style={delay(i, 90)}>
                    <span className="why-n">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{w.title}</h3>
                      <p>{w.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p data-reveal className="why-disclaimer">
                {d.course.careerDisclaimer}
              </p>
            </div>
            <div id="staff">
              <div data-reveal>
                <Kicker n="04" label={d.nav.staff} />
              </div>
              <h2 data-reveal className="h-section h-section-sm">
                {d.home.staffTitle}
              </h2>
              <div className="staff-grid">
                {C.staff.map((s, i) => (
                  <div key={s.slug} data-reveal className="lift staff" style={delay(i, 70)}>
                    <div className="zoom staff-photo">
                      <img src={s.image} alt={s.name} loading="lazy" decoding="async" />
                    </div>
                    <p className="staff-name">{s.name}</p>
                    <p className="staff-role">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Workshop photo marquee */}
        <section id="gallery" className="section-gallery">
          <div className="container">
            <div data-reveal>
              <Kicker n="05" label={d.nav.gallery} />
            </div>
            <h2 data-reveal className="h-section gallery-title">
              {d.home.galleryTitle}
            </h2>
          </div>
          <div dir="ltr" className="marquee-mask">
            <div className="marquee marquee-gallery">
              {[...C.gallery, ...C.gallery].map((src, i) => (
                <div key={i} className="zoom gallery-tile" aria-hidden={i >= C.gallery.length}>
                  <img src={src} alt="" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promo video + course reels */}
        <section id="video" className="section-plain">
          <div className="container">
            <div data-reveal className="video-head">
              <Kicker n="06" label={x.videoKicker} />
              <h2 className="h-section">{d.home.videoTitle}</h2>
              <p className="section-sub">{x.videoSub}</p>
            </div>
            <PromoVideo src={C.promo.src} poster={C.promo.poster} dur={C.promo.dur} labels={{ play: x.playLabel, kind: x.promoKind, title: x.promoTitle, sub: x.promoSub }} />
            <div className="snap reels">
              {C.reels.map((r, i) => (
                <div key={r.id} data-reveal className="reel" style={delay(i, 80)}>
                  <div className="lift zoom reel-card">
                    <img src={r.poster} alt="" loading="lazy" decoding="async" className="cover" />
                    <div className="reel-shade" />
                    <span className="play-btn play-btn-sm ring">
                      <PlayIcon size={26} style={{ marginLeft: 3 }} />
                    </span>
                    <span dir="ltr" className="dur-badge">
                      {r.dur}
                    </span>
                    <span className="reel-group">{r.groupName}</span>
                    <p className="reel-title">{r.title}</p>
                  </div>
                  <a href={r.href} target="_blank" rel="noopener" className="btn-reel">
                    {d.common.viewCourse}
                    <ArrowIcon />
                  </a>
                </div>
              ))}
            </div>
            <div data-reveal className="video-ctas">
              <a href="#register" className="btn-register">
                {d.common.registerInterest}
              </a>
              <a href={wa} target="_blank" rel="noopener" className="btn-wa">
                <WhatsAppIcon size={20} />
                {d.common.whatsapp}
              </a>
              <span>{d.course.scholarship}</span>
            </div>
          </div>
        </section>

        {/* News */}
        <section id="news" className="section-plain">
          <div className="container">
            <div data-reveal>
              <Kicker n="07" label={d.nav.news} />
            </div>
            <h2 data-reveal className="h-section gallery-title">
              {d.home.newsTitle}
            </h2>
            <div className="grid-news">
              {C.news.map((n, i) => (
                <article key={n.slug} data-reveal className="glass lift zoom news-card" style={delay(i, 100)}>
                  <div className="news-media">
                    <img src={n.image} alt="" loading="lazy" decoding="async" className="cover" />
                    <time dateTime={n.date}>{n.dateLabel}</time>
                  </div>
                  <div className="news-body">
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                    <span className="news-more">{d.common.readMore} ←</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Employers */}
        <section id="employers" className="section-plain">
          <div data-reveal className="glass employers">
            <div>
              <Kicker n="08" label="B2B" />
              <h2 className="h-employers">{d.home.employersTitle}</h2>
              <p className="employers-text">{d.home.employersText}</p>
              <a href={wa} target="_blank" rel="noopener" className="btn-employers">
                {d.common.whatsappLong}
              </a>
            </div>
            <div className="employers-items">
              {d.home.employersItems.map((e) => (
                <div key={e.title}>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                </div>
              ))}
            </div>
            <div className="zoom employers-photo">
              <img src="/assets/news/akko.webp" alt="" loading="lazy" decoding="async" className="cover" />
              <div className="employers-photo-shade" />
              <div className="employers-photo-caption">
                <p className="employers-photo-kicker">{d.home.hiringTitle}</p>
                <p>{d.home.hiringText}</p>
              </div>
            </div>
            <div className="partners">
              <span className="partners-title">{d.home.partnersTitle}</span>
              <div dir="ltr" className="marquee-mask marquee-mask-tight">
                <div className="marquee marquee-partners">
                  {[0, 1, 2, 3].flatMap((k) =>
                    C.partners.map((p) => (
                      <div key={`${k}-${p.slug}`} dir="rtl" className="partner" aria-hidden={k > 0}>
                        <img src={p.image} alt={k > 0 ? "" : p.name} loading="lazy" decoding="async" />
                        <span>{p.name}</span>
                      </div>
                    )),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section-plain">
          <div className="container container-narrow">
            <div data-reveal className="faq-head">
              <Kicker n="09" label="FAQ" center />
              <h2 className="h-section">{d.home.faqTitle}</h2>
            </div>
            <Faq items={C.faq} />
          </div>
        </section>

        {/* Contact + lead form */}
        <section id="register" className="section-contact">
          <div data-reveal className="contact">
            <div className="contact-main">
              <Kicker n="10" label={d.nav.contact} light />
              <h2 className="h-contact">{d.home.ctaTitle}</h2>
              <p className="contact-text">{x.contactText}</p>
              <div className="contact-buttons">
                <a href={telHref} className="btn-contact-call">
                  <PhoneIcon size={24} strokeWidth={2.2} />
                  <span dir="ltr">{site.phone}</span>
                  <span className="btn-contact-hint">{x.callUs}</span>
                </a>
                <a href={wa} target="_blank" rel="noopener" className="btn-contact-wa">
                  <WhatsAppIcon size={24} />
                  <span dir="ltr">{site.mobile}</span>
                  <span className="btn-contact-hint">{d.common.whatsapp}</span>
                </a>
              </div>
              <p className="contact-address">
                {site.address} · {site.hours}
              </p>
            </div>
            <div className="contact-form">
              <h3>{x.formTitle}</h3>
              <p className="contact-form-text">{x.formText}</p>
              <LeadForm
                lang={locale}
                courses={C.courses.map((c) => c.name)}
                labels={{
                  name: d.form.name,
                  phone: d.form.phone,
                  courseAny: d.form.courseAny,
                  submit: d.form.submit,
                  privacy: d.form.privacy,
                  successTitle: d.form.successTitle,
                  successText: d.form.successText,
                  error: x.formError,
                }}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <img src="/assets/brand/logo-white.png" alt={site.name} className="footer-logo" width={106} height={44} />
            <p className="footer-about">{d.footer.aboutText}</p>
          </div>
          <div>
            <h3>{d.footer.quickLinks}</h3>
            <ul className="footer-links">
              {C.menuLinks.map((m) => (
                <li key={m.href}>
                  <a href={m.href}>{m.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{d.footer.contactTitle}</h3>
            <ul className="footer-contact">
              <li>{site.address}</li>
              <li>
                <a href={telHref} dir="ltr">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={wa} dir="ltr">
                  {site.mobile}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} dir="ltr" className="footer-email">
                  {site.email}
                </a>
              </li>
            </ul>
            <div className="footer-social">
              <a href={site.facebook} target="_blank" rel="noopener" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href={site.youtube} target="_blank" rel="noopener" aria-label="YouTube">
                <YouTubeIcon />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>
              © {new Date().getFullYear()} {site.name} · {d.footer.rights}
            </span>
            <a href="#">{d.footer.accessibility}</a>
          </div>
        </div>
      </footer>

      {/* Mobile: courses + call + WhatsApp, always reachable */}
      <div className="mobile-bar-spacer mobile-only" aria-hidden />
      <nav className="glass mobile-bar mobile-only" aria-label={d.common.contactUs}>
        <a href="#starts" className="mobile-bar-courses">
          <LayersIcon color="#158942" />
          {d.nav.courses}
        </a>
        <a href={telHref} className="mobile-bar-call">
          <PhoneIcon size={22} strokeWidth={2.2} />
          {x.callUs}
        </a>
        <a href={wa} target="_blank" rel="noopener" className="mobile-bar-wa">
          <WhatsAppIcon size={24} />
          {d.common.whatsapp}
        </a>
      </nav>
    </div>
  );
}
