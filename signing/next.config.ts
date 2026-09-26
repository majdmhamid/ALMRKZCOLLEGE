import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The repo root has the website's own lockfile; this app is self-contained in signing/.
  turbopack: { root: path.join(__dirname) },
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
