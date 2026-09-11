/**
 * معلومات الكلية الثابتة: الاسم، العنوان، الهواتف، الروابط.
 * غيّر هنا مرة واحدة وتتغيّر بكل الصفحات.
 */
export const site = {
  name: {
    ar: "كلية المركز للتأهيل المهني",
    he: "מכללת המרכז להכשרה מקצועית",
  },
  shortName: { ar: "كلية المركز", he: "מכללת המרכז" },
  city: { ar: "أم الفحم", he: "אום אל-פחם" },
  foundedYear: 2008,
  /** الرابط النهائي للموقع — يُستخدم في SEO وخريطة الموقع */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.almrkz.net",
  phone: "04-6116800",
  phoneIntl: "+97246116800",
  mobile: "054-6174339",
  whatsappUrl: "https://wa.me/972546174339",
  email: "almerkaz.collega@gmail.com",
  address: {
    ar: "أم الفحم – حي قحاوش – خلف المشهداوي",
    he: "אום אל-פחם – שכונת קחאוש – מאחורי אל-משהדאווי",
  },
  /** رابط خريطة جوجل (بحث بالاسم — يُستبدل بالإحداثيات الدقيقة لاحقاً) */
  mapQuery: "كلية المركز للتأهيل المهني أم الفحم",
  social: {
    facebook: "https://www.facebook.com/almerkaz.collega/",
    youtube: "https://www.youtube.com/channel/UCieezydJBA3mmdXvl8p6BnQ",
    instagram: "", // لم نجد حساب إنستغرام للكلية — يُضاف إذا وُجد
  },
  /** ساعات الاستقبال — بانتظار تأكيدها من إدارة الكلية */
  hours: {
    ar: "الأحد – الخميس · للاستفسار عن ساعات الاستقبال تواصل معنا",
    he: "ראשון – חמישי · לשעות קבלה מדויקות צרו קשר",
  },
} as const;
