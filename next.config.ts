import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Set assetPrefix to the Vercel domain in production to serve chunks and assets directly from CDN,
  // preventing 404 errors when accessed via a subfolder reverse proxy path.
  assetPrefix: isProd ? "https://synapse-cs.vercel.app" : undefined,
};

export default nextConfig;
