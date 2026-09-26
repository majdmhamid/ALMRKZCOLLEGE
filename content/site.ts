import type { L10n } from "./types";

export const site = {
  name: { ar: "كلية المركز للتأهيل المهني", he: "מכללת המרכז להכשרה מקצועית" } as L10n,
  shortName: { ar: "كلية المركز", he: "מכללת המרכז" } as L10n,
  city: { ar: "أم الفحم", he: "אום אל-פחם" } as L10n,
  foundedYear: 2008,
  phone: "04-6116800",
  phoneIntl: "+97246116800",
  mobile: "054-6174339",
  whatsappUrl: "https://wa.me/972546174339",
  email: "almerkaz.collega@gmail.com",
  address: { ar: "أم الفحم – حي قحاوش – خلف المشهداوي", he: "אום אל-פחם – שכונת קחאוש – מאחורי אל-משהדאווי" } as L10n,
  facebook: "https://www.facebook.com/almerkaz.collega/",
  youtube: "https://www.youtube.com/channel/UCieezydJBA3mmdXvl8p6BnQ",
  hours: { ar: "الأحد – الخميس · للاستفسار عن ساعات الاستقبال تواصل معنا", he: "ראשון – חמישי · לשעות קבלה מדויקות צרו קשר" } as L10n,
};

export const telHref = `tel:${site.phoneIntl}`;

/** WhatsApp link, optionally with a pre-filled message. */
export function waHref(text?: string) {
  return text ? `${site.whatsappUrl}?text=${encodeURIComponent(text)}` : site.whatsappUrl;
}
