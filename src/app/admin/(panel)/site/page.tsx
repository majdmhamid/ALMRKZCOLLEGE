"use client";

import { Phone } from "lucide-react";
import Footer from "@/components/Footer";
import type { SiteInfo } from "@/lib/cms/schema";
import { PageIntro } from "../../_components/bits";
import PageMini from "../../_components/PageMini";
import { FieldGroup, LocalizedField, NumberField, TextField } from "../../_components/fields";
import { useAdmin } from "../../_lib/store";

/** 054-6174339 → 972546174339 */
const intl = (local: string) => {
  const d = local.replace(/\D/g, "");
  return d.startsWith("972") ? d : d.startsWith("0") ? `972${d.slice(1)}` : d;
};

export default function SiteInfoEditor() {
  const { draft, update, locale, data } = useAdmin();
  const s = draft.site;
  const set = (patch: Partial<SiteInfo>) => update("site", (prev) => ({ ...prev, ...patch }));
  const dict = data.dict(locale);

  return (
    <div>
      <PageIntro title="معلومات الكلية" text="هاي المعلومات بتظهر بكل صفحات الموقع: فوق بالشريط العلوي، تحت بالتذييل، بصفحة «اتصل بنا»، وبأزرار الاتصال والواتساب. غيّرها هون مرة وحدة وبتتغيّر بكل مكان." />
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <FieldGroup title="التواصل">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="هاتف المكتب" dir="ltr" value={s.phone} onChange={(phone) => set({ phone, phoneIntl: `+${intl(phone)}` })} />
              <TextField label="موبايل / واتساب" dir="ltr" value={s.mobile} onChange={(mobile) => set({ mobile, whatsappUrl: `https://wa.me/${intl(mobile)}` })} hint="زر الواتساب بالموقع بيفتح على هاد الرقم." />
            </div>
            <TextField label="الإيميل" dir="ltr" type="email" value={s.email} onChange={(email) => set({ email })} hint="لهون بتوصل استمارات «سجّل اهتمامك»." />
            <LocalizedField label="العنوان" value={s.address} onChange={(address) => set({ address })} />
            <TextField label="البحث بخريطة جوجل" value={s.mapQuery} onChange={(mapQuery) => set({ mapQuery })} hint="الاسم اللي بتنبحث فيه الكلية على خرائط جوجل." />
            <LocalizedField label="أيام وساعات الدوام" value={s.hours} onChange={(hours) => set({ hours })} />
          </FieldGroup>
          <FieldGroup title="شبكات التواصل" hint="اتركها فاضية إذا ما في حساب.">
            <TextField label="فيسبوك" dir="ltr" value={s.social.facebook} onChange={(facebook) => set({ social: { ...s.social, facebook } })} />
            <TextField label="يوتيوب" dir="ltr" value={s.social.youtube} onChange={(youtube) => set({ social: { ...s.social, youtube } })} />
            <TextField label="إنستغرام" dir="ltr" value={s.social.instagram} onChange={(instagram) => set({ social: { ...s.social, instagram } })} />
          </FieldGroup>
          <FieldGroup title="اسم الكلية">
            <LocalizedField label="الاسم الكامل" value={s.name} onChange={(name) => set({ name })} />
            <LocalizedField label="اسم قصير" value={s.shortName} onChange={(shortName) => set({ shortName })} />
            <LocalizedField label="المدينة" value={s.city} onChange={(city) => set({ city })} />
            <NumberField label="سنة التأسيس" value={s.foundedYear} onChange={(foundedYear) => set({ foundedYear })} min={1900} />
          </FieldGroup>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-24">
          <p className="text-sm font-extrabold text-ink-muted">معاينة حيّة</p>
          <div className="site-frame">
            <div className="site-frame-bar">
              <i />
              <i />
              <i />
              <span className="ms-2 font-bold">أسفل كل صفحة (التذييل)</span>
            </div>
            <div lang={locale}>
              <PageMini>
                <Footer locale={locale} dict={dict} site={data.site} groups={data.navGroups(locale)} />
              </PageMini>
            </div>
          </div>
          <div className="card flex flex-wrap gap-3 p-4">
            <a href={`tel:${s.phoneIntl}`} className="btn btn-outline btn-sm">
              <Phone size={16} /> جرّب زر الاتصال
            </a>
            <a href={s.whatsappUrl} target="_blank" rel="noopener" className="btn btn-whatsapp btn-sm">
              جرّب زر الواتساب
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
