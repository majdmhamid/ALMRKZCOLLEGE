import Script from "next/script";

/**
 * أدوات القياس — تُفعَّل فقط عند وجود المفاتيح في إعدادات البيئة (.env.local أو Vercel):
 *   NEXT_PUBLIC_GA_ID          = معرّف Google Analytics 4 (مثل G-XXXXXXX)
 *   NEXT_PUBLIC_META_PIXEL_ID  = معرّف Meta Pixel (فيسبوك/إنستغرام) — أرقام فقط
 * بدون المفاتيح لا يُحمَّل أي سكربت خارجي (الموقع أسرع وأخفّ).
 * Google Search Console: يُثبت عبر ملف HTML أو سجل DNS عند الإطلاق — لا يحتاج كوداً هنا.
 */
export default function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!ga && !pixel) return null;
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
