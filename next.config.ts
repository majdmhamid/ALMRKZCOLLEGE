import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hebrew is the default language; Arabic lives at /ar.
  async redirects() {
    return [{ source: "/", destination: "/he", permanent: false }];
  },
};

export default nextConfig;
