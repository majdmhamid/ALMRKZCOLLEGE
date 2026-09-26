import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Native / WASM modules: sharp (signature trimming), PGlite (mock-mode database).
  serverExternalPackages: ["sharp", "@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // Signature PNGs are small; PDFs never pass through the server (direct signed upload).
      bodySizeLimit: "2mb",
    },
  },
};

export default withNextIntl(nextConfig);
