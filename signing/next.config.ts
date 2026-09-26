import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // sharp is a native module used for signature trimming; keep it out of the bundle.
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Signature PNGs are small; PDFs never pass through the server (direct signed upload).
      bodySizeLimit: "2mb",
    },
  },
};

export default withNextIntl(nextConfig);
