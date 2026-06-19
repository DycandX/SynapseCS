import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 SOLUSI UTAMA: Beritahu Next.js bahwa aplikasi ini berjalan di sub-folder /synapse-cs
  basePath: "/synapse-cs",

  // Catatan: Kamu bisa menghapus atau mengomentari baris assetPrefix di bawah ini 
  // karena basePath secara otomatis menangani perutean aset statis dengan aman.
  // assetPrefix: process.env.NODE_ENV === "production" ? "https://synapse-cs.vercel.app" : undefined,
};

export default nextConfig;