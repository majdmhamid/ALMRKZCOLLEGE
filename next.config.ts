import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** نصوص التوقيع الإلكتروني (عربي/عبري) — next-intl بدون توجيه باللغة */
const withNextIntl = createNextIntlPlugin("./src/features/signing/i18n/request.ts");

/** صور لوحة التحكم على Supabase Storage (إذا كان مضبوطاً) */
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // لا تعدّل CLAUDE.md تلقائياً (ملف تعليمات المشروع مكتوب بإيدينا)
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // صور فيديوهات يوتيوب المضافة من لوحة التحكم
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
  // sharp: الصور والتواقيع · PGlite: قاعدة البيانات بوضع التجربة
  serverExternalPackages: ["sharp", "@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // رفع الصور من لوحة التحكم (تُصغَّر بالمتصفح قبل الإرسال)
      bodySizeLimit: "8mb",
    },
  },
  async redirects() {
    // الصفحة الجذر تحوّل للعربي (اللغة الأساسية). العبري عبر زر التبديل أو /he مباشرة.
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default withNextIntl(nextConfig);
