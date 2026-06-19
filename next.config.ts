import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. HAPUS atau komentari baris basePath jika sebelumnya ada
  // basePath: "/synapse-cs",

  // 2. Gunakan assetPrefix agar aset (.js, .css, images) dibaca langsung dari CDN Vercel aslinya
  assetPrefix: process.env.NODE_ENV === "production" ? "https://synapse-cs.vercel.app" : undefined,
};

export default nextConfig;