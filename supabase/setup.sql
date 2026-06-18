-- ─────────────────────────────────────────────────────────────
-- SynapseCS — Database Setup Script (Gemini & pgvector Optimized)
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Enable Required Extensions
create extension if not exists vector;

-- 2. Create Profiles Table (Linked to Supabase Auth Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'agent')) default 'agent',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Allow read access for authenticated users" on public.profiles
  for select to authenticated using (true);

create policy "Allow update access for users to their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

create policy "Allow admin to manage all profiles" on public.profiles
  for all to authenticated using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Create Customers Table
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Customers
alter table public.customers enable row level security;

-- Policies for Customers
create policy "Allow read and write access for authenticated users" on public.customers
  for all to authenticated using (true) with check (true);

-- 4. Create Conversations Table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers on delete cascade not null,
  agent_id uuid references public.profiles on delete set null,
  status text not null check (status in ('open', 'pending', 'closed')) default 'open',
  sentiment text not null check (sentiment in ('marah', 'netral', 'puas')) default 'netral',
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Conversations
alter table public.conversations enable row level security;

-- Policies for Conversations
create policy "Allow read and write access for authenticated users" on public.conversations
  for all to authenticated using (true) with check (true);

-- 5. Create Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_type text not null check (sender_type in ('customer', 'agent', 'ai_system')),
  content text not null,
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Messages
alter table public.messages enable row level security;

-- Policies for Messages
create policy "Allow read and write access for authenticated users" on public.messages
  for all to authenticated using (true) with check (true);

-- 6. Create Knowledge Embeddings Table (pgvector 768-dim for Gemini text-embedding-004)
create table public.knowledge_embeddings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  embedding vector(768) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Knowledge Embeddings
alter table public.knowledge_embeddings enable row level security;

-- Policies for Knowledge Embeddings
create policy "Allow read access for authenticated users" on public.knowledge_embeddings
  for select to authenticated using (true);

create policy "Allow admin to manage knowledge embeddings" on public.knowledge_embeddings
  for all to authenticated using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- 7. Cosine Similarity Vector Search Function (768 Dimensions)
create or replace function public.match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    1 - (knowledge_embeddings.embedding <=> query_embedding) as similarity
  from knowledge_embeddings
  where 1 - (knowledge_embeddings.embedding <=> query_embedding) > match_threshold
  order by knowledge_embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- 8. Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Add Mock Data (Customers, Knowledge Base Default Entries)
-- Insert customers
insert into public.customers (id, name, email, phone, created_at) values
  ('c1000000-0000-0000-0000-000000000001', 'Ahmad Fauzi', 'ahmad.fauzi@gmail.com', '+6281234567890', now() - interval '30 days'),
  ('c1000000-0000-0000-0000-000000000002', 'Siti Nurhaliza', 'siti.nurhaliza@yahoo.com', '+6281345678901', now() - interval '28 days'),
  ('c1000000-0000-0000-0000-000000000003', 'Rudi Hermawan', 'rudi.h@outlook.com', '+6281456789012', now() - interval '25 days'),
  ('c1000000-0000-0000-0000-000000000004', 'Maya Sari', 'maya.sari@gmail.com', '+6281567890123', now() - interval '20 days'),
  ('c1000000-0000-0000-0000-000000000005', 'Teguh Prasetyo', 'teguh.p@proton.me', '+6281678901234', now() - interval '15 days'),
  ('c1000000-0000-0000-0000-000000000006', 'Lina Marlina', 'lina.m@gmail.com', '+6281789012345', now() - interval '10 days')
on conflict (email) do nothing;

-- Insert standard SOPs with 768-dim zero-vector placeholders
-- Embeddings will be updated when managed through admin or AI pipeline
insert into public.knowledge_embeddings (id, title, content, embedding) values
  ('b0000000-0000-0000-0000-000000000001', 'SOP Penanganan Keluhan Pelanggan', 'Langkah 1: Sapa pelanggan dengan ramah dan empati. Langkah 2: Identifikasi masalah utama. Langkah 3: Berikan solusi sesuai kebijakan. Langkah 4: Follow-up dalam 24 jam. Langkah 5: Pastikan pelanggan puas sebelum menutup tiket.', array_fill(0, ARRAY[768])::vector),
  ('b0000000-0000-0000-0000-000000000002', 'SOP Pengembalian Dana (Refund)', 'Refund dapat diproses jika: 1) Pesanan dibatalkan sebelum dikirim. 2) Barang cacat/rusak saat diterima (sertakan foto). 3) Barang tidak sesuai deskripsi. Proses refund: 3-5 hari kerja ke rekening asal. Batas waktu klaim: 7 hari setelah penerimaan.', array_fill(0, ARRAY[768])::vector),
  ('b0000000-0000-0000-0000-000000000003', 'SOP Perubahan Alamat Pengiriman', 'Perubahan alamat hanya bisa dilakukan jika pesanan belum masuk proses pengiriman (status: Diproses). Hubungi tim logistik melalui channel internal untuk update. Konfirmasi perubahan ke pelanggan via chat.', array_fill(0, ARRAY[768])::vector),
  ('b0000000-0000-0000-0000-000000000004', 'SOP Eskalasi Masalah ke Supervisor', 'Eskalasi diperlukan jika: 1) Pelanggan mengancam tindakan hukum. 2) Nilai transaksi di atas Rp 5.000.000. 3) Masalah teknis yang tidak bisa diselesaikan agen. 4) Pelanggan meminta bicara dengan atasan. Catat semua detail sebelum eskalasi.', array_fill(0, ARRAY[768])::vector),
  ('b0000000-0000-0000-0000-000000000005', 'SOP Reset Password Pelanggan', 'Langkah 1: Verifikasi identitas pelanggan (email + nomor telepon terdaftar). Langkah 2: Kirim link reset password via email terdaftar. Langkah 3: Jika email tidak bisa diakses, lakukan verifikasi KTP. Langkah 4: Reset manual oleh admin teknis.', array_fill(0, ARRAY[768])::vector)
on conflict do nothing;
