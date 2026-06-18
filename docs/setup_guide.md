# Panduan Setup Backend SynapseCS

Dokumen ini berisi panduan langkah-demi-langkah untuk mengonfigurasi semua perkakas (*tools*) dan layanan backend yang dibutuhkan oleh aplikasi SynapseCS: **Supabase**, **Google AI Studio (Gemini API)**, dan **Resend**.

---

## 1. Setup Supabase (Database, Auth, Realtime, & Storage)

Supabase digunakan sebagai penyedia *Backend-as-a-Service* (BaaS) gratis yang menyimpan data, mengelola otentikasi, mendistribusikan pembaruan real-time, dan menyimpan file lampiran.

### Langkah 1: Buat Proyek Supabase Baru
1. Buka [Supabase Dashboard](https://supabase.com) dan masuk dengan akun Anda (gratis).
2. Klik tombol **New Project** dan pilih organisasi Anda.
3. Masukkan informasi proyek:
   - **Name**: `SynapseCS`
   - **Database Password**: *Buat sandi yang aman dan catat baik-baik*
   - **Region**: Pilih region terdekat (misal: *Singapore* untuk Asia Tenggara)
   - **Pricing**: Pilih **Free Plan**
4. Klik **Create new project** dan tunggu beberapa menit hingga inisialisasi basis data selesai.

### Langkah 2: Jalankan Naskah SQL Database
1. Setelah proyek aktif, klik menu **SQL Editor** pada panel kiri dashboard (ikon lembar kerja dengan tanda `SQL`).
2. Klik **New Query** untuk membuat editor baru.
3. Salin seluruh isi dari berkas `supabase/setup.sql` di proyek Anda.
4. Tempel (*paste*) kode SQL tersebut ke editor Supabase, lalu klik tombol **Run** di bagian kanan bawah.
5. Pastikan muncul pesan sukses: `Success. No rows returned.`

### Langkah 3: Setup Storage Bucket (Untuk Lampiran File)
1. Klik menu **Storage** pada panel kiri dashboard Supabase (ikon kotak penyimpanan).
2. Klik tombol **New Bucket**.
3. Beri nama bucket: **`attachments`** (harus sama persis karena akan digunakan di kode).
4. Centang opsi **Public Bucket** agar tautan berkas dapat diakses secara publik oleh agen/pelanggan.
5. Klik **Create Bucket**.
6. Klik **RLS policies** di sebelah nama bucket, lalu pastikan kebijakan RLS mengizinkan pembacaan publik dan pengunggahan oleh pengguna terotentikasi (sudah tercover oleh naskah `setup.sql` kita).

### Langkah 4: Aktifkan Real-time untuk Tabel Messages
1. Klik menu **Database** (ikon silinder database) -> **Replication**.
2. Pada baris **supabase_realtime**, klik tombol **Source** (atau tabel yang aktif).
3. Pastikan tabel **`messages`** dan **`conversations`** dicentang atau diaktifkan untuk replikasi agar WebSockets dapat menerima pesan secara instan.

---

## 2. Setup Google AI Studio (Gemini API Key)

Google AI Studio digunakan untuk mengakses model **Gemini 1.5 Flash** dan **text-embedding-004** secara gratis.

### Langkah-langkah:
1. Buka halaman [Google AI Studio](https://aistudio.google.com/) dan masuk menggunakan akun Google Anda.
2. Klik tombol **Get API Key** di pojok kiri atas.
3. Klik tombol **Create API Key**.
4. Pilih opsi **Create API key in new project** (atau hubungkan ke proyek Google Cloud yang sudah ada).
5. Tunggu proses pembuatan selesai, lalu salin (*copy*) kunci API yang dihasilkan (formatnya biasanya diawali dengan `AIzaSy...`).
6. Catat kunci API ini dengan aman. Jangan pernah membagikannya atau memasukkannya ke dalam repositori git.

---

## 3. Setup Resend (Notifikasi Email)

Resend digunakan untuk mengirim notifikasi email otomatis ke kotak masuk agen ketika pelanggan mengirim pesan dengan emosi/sentimen marah.

### Langkah-langkah:
1. Buka [Resend Website](https://resend.com) dan buat akun gratis.
2. Setelah masuk, buka menu **API Keys** di panel navigasi kiri.
3. Klik tombol **Create API Key**.
4. Beri nama kunci API (misal: `SynapseCS Dev`).
5. Setel permission ke **Full Access**.
6. Klik **Add** dan salin kunci API yang muncul (format: `re_...`).
7. *Catatan Free Tier*: Secara default, jika Anda tidak menghubungkan domain kustom di Resend, email hanya dapat dikirim dari alamat sandbox `onboarding@resend.dev` dan **HANYA bisa dikirim ke email terdaftar akun Resend Anda sendiri**. Untuk keperluan demo/pengembangan, hal ini sudah cukup.

---

## 4. Konfigurasi Variabel Lingkungan (.env.local)

Setelah mendapatkan kredensial dari ketiga layanan di atas, Anda perlu membuat berkas konfigurasinya:

1. Buat berkas baru bernama **`.env.local`** di direktori utama (*root*) proyek Next.js Anda.
2. Salin variabel berikut dan isi dengan data yang sesuai:

```env
# Kredensial Supabase (Dapatkan di Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI Studio API Key (Untuk Gemini LLM & Embeddings)
GEMINI_API_KEY=AIzaSy...

# Resend API Key (Untuk Notifikasi Email)
RESEND_API_KEY=re_...
# Alamat email tujuan penerima alerts (Gunakan email akun Resend Anda untuk Sandbox mode)
ADMIN_ALERT_EMAIL=email_anda@domain.com
```

3. Simpan berkas tersebut. Sekarang aplikasi siap dijalankan menggunakan perintah `npm run dev` untuk terhubung ke backend asli!
