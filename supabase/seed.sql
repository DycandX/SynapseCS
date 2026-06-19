-- ─────────────────────────────────────────────────────────────
-- SynapseCS — Data Seed Script (Conversations & Messages)
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Seed Conversations (assigned as unassigned/null agent so the logged-in agent can claim them)
insert into public.conversations (id, customer_id, agent_id, status, sentiment, ai_summary, created_at, updated_at) values
  ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', null, 'open', 'marah', null, now() - interval '2 days', now() - interval '1 day'),
  ('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', null, 'open', 'netral', null, now() - interval '1 day', now() - interval '18 hours'),
  ('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', null, 'pending', 'netral', 'Pelanggan menanyakan status pengiriman pesanan #ORD-4821. Pesanan sudah dikirim melalui kurir JNE dan estimasi tiba besok.', now() - interval '3 days', now() - interval '2 days'),
  ('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', null, 'open', 'marah', null, now() - interval '12 hours', now() - interval '10 hours'),
  ('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', null, 'closed', 'puas', 'Pelanggan puas dengan resolusi masalah pengembalian dana. Dana dikembalikan dalam 3 hari kerja.', now() - interval '5 days', now() - interval '4 days'),
  ('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', null, 'open', 'netral', null, now() - interval '6 hours', now() - interval '5 hours')
on conflict (id) do nothing;

-- 2. Seed Messages
insert into public.messages (id, conversation_id, sender_type, content, created_at) values
  -- conv1: Ahmad Fauzi (marah)
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'customer', 'Halo, saya sangat kecewa! Barang yang saya pesan sudah 2 minggu belum sampai. Ini tidak bisa diterima!', now() - interval '2 days'),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'customer', 'Nomor pesanan saya #ORD-7291. Saya sudah bayar lunas tapi tidak ada kejelasan. Kalau tidak bisa ditangani, saya minta refund sekarang!', now() - interval '2 days' + interval '2 minutes'),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'agent', 'Selamat pagi, Pak Ahmad. Kami mohon maaf atas ketidaknyamanan ini. Saya akan cek status pesanan Anda sekarang. Mohon ditunggu sebentar.', now() - interval '2 days' + interval '10 minutes'),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'ai_system', '📊 Analisis Sentimen: MARAH — Pelanggan mengekspresikan kekecewaan tinggi terkait keterlambatan pengiriman dan mengancam meminta refund.', now() - interval '2 days' + interval '10 minutes' + interval '30 seconds'),
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'agent', 'Pak Ahmad, saya sudah mengecek pesanan #ORD-7291. Ternyata ada kendala di gudang ekspedisi sehingga pengiriman tertunda. Saya akan eskalasi dan pastikan paket dikirim hari ini.', now() - interval '2 days' + interval '20 minutes'),
  ('f1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', 'customer', 'Pastikan ya. Kalau besok belum sampai, saya akan report dan minta full refund.', now() - interval '2 days' + interval '25 minutes'),
  ('f1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000001', 'agent', 'Baik, Pak Ahmad. Kami akan pantau terus. Saya akan update Bapak segera setelah ada perkembangan. Terima kasih atas kesabarannya.', now() - interval '2 days' + interval '30 minutes'),

  -- conv2: Siti Nurhaliza (netral)
  ('f1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000002', 'customer', 'Permisi, saya mau tanya cara ganti alamat pengiriman. Pesanan saya belum dikirim kan?', now() - interval '1 day'),
  ('f1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000002', 'agent', 'Halo, Kak Siti! Tentu, bisa dibantu. Boleh infokan nomor pesanannya?', now() - interval '1 day' + interval '5 minutes'),
  ('f1000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000002', 'customer', 'Nomor pesanan #ORD-8102. Saya mau ganti ke Jl. Merpati No. 15, Jakarta Selatan.', now() - interval '1 day' + interval '10 minutes'),
  ('f1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000002', 'agent', 'Baik, Kak Siti. Pesanan #ORD-8102 belum diproses kirim jadi masih bisa diubah. Saya update alamatnya sekarang ya.', now() - interval '1 day' + interval '15 minutes'),
  ('f1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000002', 'customer', 'Terima kasih banyak! 🙏', now() - interval '1 day' + interval '20 minutes'),

  -- conv3: Rudi Hermawan (netral, pending)
  ('f1000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000003', 'customer', 'Halo, saya ingin menanyakan status pengiriman pesanan saya #ORD-4821.', now() - interval '3 days'),
  ('f1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000003', 'agent', 'Halo, Pak Rudi. Pesanan #ORD-4821 sudah dikirim melalui JNE dengan nomor resi JNE-9812345678. Estimasi tiba besok.', now() - interval '3 days' + interval '15 minutes'),
  ('f1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000003', 'customer', 'Baik, terima kasih infonya. Saya tunggu ya.', now() - interval '3 days' + interval '20 minutes'),

  -- conv4: Maya Sari (marah)
  ('f1000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000004', 'customer', 'TOLONG!! Akun saya terkunci dan saya tidak bisa login sama sekali! Saya sudah coba reset password 3 kali tetap gagal!', now() - interval '12 hours'),
  ('f1000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000004', 'customer', 'Ini sangat mendesak, saya harus mengakses akun untuk urusan pekerjaan penting hari ini!', now() - interval '12 hours' + interval '5 minutes'),
  ('f1000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000004', 'ai_system', '📊 Analisis Sentimen: MARAH — Pelanggan mengalami masalah akses akun yang mendesak dan menunjukkan frustrasi tinggi.', now() - interval '12 hours' + interval '5 minutes' + interval '30 seconds'),

  -- conv5: Teguh (puas, closed)
  ('f1000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000005', 'customer', 'Halo, saya ingin menanyakan soal pengembalian dana untuk pesanan #ORD-3310 yang saya batalkan.', now() - interval '5 days'),
  ('f1000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000005', 'agent', 'Halo, Pak Teguh. Pembatalan pesanan #ORD-3310 sudah diproses. Dana akan dikembalikan dalam 3 hari kerja ke rekening Anda.', now() - interval '5 days' + interval '15 minutes'),
  ('f1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000005', 'customer', 'Mantap, sudah masuk dananya. Terima kasih pelayanannya! 👍', now() - interval '4 days')
on conflict (id) do nothing;
