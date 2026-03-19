import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL;

const nextConfig: NextConfig = {
  // Static export - frontend only, API served by Go backend
  output: "export",
  // basePath for subdirectory deployment (e.g., /bg-remover on production server)
  ...(isProduction ? { basePath: "/bg-remover" } : {}),
  // Turbopack config (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
