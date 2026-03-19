import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router with Server Components & Route Handlers (no static export)
  // Turbopack config (Next.js 16 default)
  turbopack: {},
};

import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

export default nextConfig;
