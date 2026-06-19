# SynapseCS — AI-Powered Customer Support Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Gemini_AI-6d28d9?style=flat-square)](https://openrouter.ai/)
[![Resend](https://img.shields.io/badge/Resend-Email_Service-000000?style=flat-square)](https://resend.com/)

**SynapseCS** adalah platform manajemen layanan pelanggan (*customer support*) modern yang mengintegrasikan kecerdasan buatan (AI) secara riil untuk membantu produktivitas agen CS. Platform ini dirancang dengan performa tinggi, UI/UX premium yang responsif, arsitektur micro-frontend (reverse proxy) yang aman, serta sistem pencatatan aktivitas (*audit trail*) standar industri.

---

## 🌟 Fitur Utama

1.  **Dashboard Analytics & Statistik**: Visualisasi metrik penting secara riil seperti Customer Satisfaction Score (CSAT), jumlah tiket terbuka/tertunda/selesai, serta grafik distribusi sentimen obrolan.
2.  **Inbox & Chat Room Realtime**:
    *   **Smooth Native Scrolling**: Navigasi utas chat yang dioptimalkan untuk perangkat mobile.
    *   **Responsive Collapsible Profile**: Panel profil pelanggan yang dinamis (menjadi panel geser/laci *Sheet* pada layar mobile/tablet).
    *   **Klaim Tiket Interaktif**: Tombol untuk merebut atau menugaskan tiket *Unassigned* ke agen aktif.
    *   **Interactive Status Dropdown**: Ubah status tiket langsung dari inbox (Terbuka, Tertunda, Selesai) dengan pembaruan *realtime* di seluruh dashboard agen lain.
3.  **AI Integration (Gemini 2.0 via OpenRouter)**:
    *   **Analisis Sentimen Otomatis**: Mendeteksi emosi pelanggan (Puas, Netral, Marah) di setiap pesan baru.
    *   **Sistem RAG SOP (AI Draft)**: AI merancang draf balasan otomatis secara cerdas berdasarkan dokumen SOP terdekat yang dicocokkan menggunakan Gemini Vector Embeddings (`text-embedding-004`) di PostgreSQL `pgvector`.
    *   **Ringkasan AI 3 Poin**: Merangkum riwayat percakapan panjang dengan cepat ke dalam ringkasan eksekutif.
4.  **Eskalasi Darurat (Resend Notification)**: Deteksi otomatis sentimen "MARAH" pada pesan masuk pelanggan langsung memicu peringatan darurat ke kotak masuk admin via Resend Email Service.
5.  **Log Aktivitas & Audit (System Logs)**: Pencatatan jejak audit (audit logs) yang terstruktur saat agen mengklaim tiket, membalas pesan, memperbarui SOP, atau terjadi eskalasi AI.
6.  **Micro-Frontend Ready (Reverse Proxy)**: Dikonfigurasi agar dapat dijalankan sebagai sub-proyek di bawah path url domain utama (misal: `https://domain-utama.com/synapse-cs`) melalui Next.js `basePath`.

---

## 🛠️ Tech Stack

*   **Frontend / Core**: Next.js 16 (App Router, React Server Actions), TypeScript.
*   **Styling**: Vanilla Tailwind CSS, Lucide Icons, Glassmorphism, Radix/Base UI Dialog Primitives.
*   **Database & Auth**: Supabase (PostgreSQL, Row Level Security, pgvector, Realtime Channels).
*   **Integrasi Pihak Ketiga**:
    *   **OpenRouter API** (Model: `google/gemini-2.0-flash-exp:free` & Gemini Embeddings).
    *   **Resend API** (Layanan pengiriman email notifikasi).

---

## 📂 Struktur Proyek Utama

```text
├── src/
│   ├── app/                      # Next.js App Router (Pages, API Routes, Server Actions)
│   │   ├── (dashboard)/          # Halaman Inbox, Dashboard, Pengaturan, Pelanggan
│   │   ├── api/                  # API Route Handler (Simulator & Integrasi)
│   │   ├── actions.ts            # Server Actions Terpusat (Supabase & Cookie Session)
│   │   └── page.tsx              # Halaman Login
│   ├── components/               # Komponen UI Reusable
│   │   ├── layout/               # Sidebar dan Topbar Layout
│   │   └── ui/                   # Komponen Primitif (Button, Dropdown, Dialog, dll.)
│   ├── lib/                      # Utilitas Pembantu & Pipeline AI (OpenRouter, Resend)
│   └── utils/supabase/           # Inisialisasi Supabase Server & Client
├── supabase/                     # Skema & Migrasi Database
│   ├── setup.sql                 # Skema tabel, indeks performa, RLS, & fungsi PostgreSQL
│   └── seed.sql                  # Data simulasi awal (percakapan & pesan)
└── next.config.ts                # Konfigurasi Next.js (basePath & subpath routing)
```

---

## 🚀 Memulai Penginstalan

### 1. Prasyarat
Pastikan Anda memiliki hal-hal berikut terinstal di sistem Anda:
*   [Node.js](https://nodejs.org/) (versi 18+ direkomendasikan)
*   Akun [Supabase](https://supabase.com)
*   API Key [OpenRouter](https://openrouter.ai)
*   API Key [Resend](https://resend.com)

### 2. Klon Repositori & Pasang Dependensi
```bash
git clone https://github.com/DycandX/SynapseCS.git
cd SynapseCS
npm install
```

### 3. Konfigurasi Variabel Lingkungan
Salin berkas template `.env.example` menjadi `.env.local` di direktori utama proyek:
```bash
cp .env.example .env.local
```
Buka `.env.local` dan lengkapi kredensial Supabase, API Key OpenRouter, API Key Resend, dan email notifikasi admin Anda.

### 4. Setup Skema Database Supabase
1.  Buka **Supabase Dashboard** proyek Anda.
2.  Masuk ke menu **SQL Editor** -> **New Query**.
3.  Salin seluruh isi berkas [supabase/setup.sql](file:///E:/_PROJECT/AI%20Customer%20Support%20(synapse-ai)/supabase/setup.sql) dan jalankan (**Run**). Ini akan membuat tabel-tabel (`profiles`, `customers`, `conversations`, `messages`, `activity_logs`, `knowledge_embeddings`), memasang ekstensi `vector`, menyiapkan kebijakan RLS, dan membuat pemicu pendaftaran profil.
4.  (*Opsional*) Salin dan jalankan isi berkas [supabase/seed.sql](file:///E:/_PROJECT/AI%20Customer%20Support%20(synapse-ai)/supabase/seed.sql) untuk mengisi data percakapan simulasi awal ke inbox.

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi sekarang dapat diakses secara lokal di `http://localhost:3000/synapse-cs` (jika menggunakan konfigurasi `basePath`).

---

## ⚙️ Konfigurasi Reverse Proxy (Micro-Frontend)

Untuk men-deploy aplikasi ini di belakang reverse proxy domain utama (misal: `https://zulvikar.is-a.dev/synapse-cs`):

1.  **Next.js Config**: `basePath` diatur ke `"/synapse-cs"` di `next.config.ts`.
2.  **Redirect URLs Supabase**: Daftarkan URL berikut di pengaturan **Supabase Authentication -> URL Configuration -> Redirect URLs**:
    *   `https://zulvikar.is-a.dev/synapse-cs/**`
3.  **Site URL Supabase**: Atur Site URL ke `https://zulvikar.is-a.dev/synapse-cs`.
4.  **NEXT_PUBLIC_APP_URL**: Setel nilai ini di environment Vercel Anda ke `https://zulvikar.is-a.dev/synapse-cs`.

---

## 🔒 Kebijakan Keamanan (Security)

Aplikasi ini menggunakan `@supabase/ssr` untuk mengelola otentikasi berbasis cookie per-permintaan (*per-request*). Hal ini mencegah kebocoran sesi memori pengguna (*cross-session memory leaks*) pada Server Actions dan Route Handlers. Seluruh akses baca/tulis ke tabel database dikunci menggunakan **PostgreSQL Row Level Security (RLS)** dan hanya dapat diakses oleh akun agen/admin terotentikasi.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat berkas `LICENSE` untuk rincian lebih lanjut.
