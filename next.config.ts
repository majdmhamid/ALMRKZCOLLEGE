import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // الصفحة الجذر تحوّل للعربي (اللغة الأساسية). العبري عبر زر التبديل أو /he مباشرة.
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default nextConfig;
