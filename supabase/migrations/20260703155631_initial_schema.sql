-- ─────────────────────────────────────────────────────────────
-- SynapseCS — Database Setup Script (Gemini & pgvector Optimized)
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
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
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
create policy "Allow select access for authenticated users" on public.customers
  for select to authenticated using (true);

create policy "Allow insert access for authenticated users" on public.customers
  for insert to authenticated with check (true);

create policy "Allow admin to update and delete customers" on public.customers
  for all to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

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
create policy "Allow select access for agents" on public.conversations
  for select to authenticated using (
    agent_id = auth.uid() or agent_id is null
  );

create policy "Allow update access for agents" on public.conversations
  for update to authenticated using (
    agent_id = auth.uid() or agent_id is null
  ) with check (
    agent_id = auth.uid() or agent_id is null
  );

create policy "Allow insert access for agents" on public.conversations
  for insert to authenticated with check (
    agent_id is null
  );

create policy "Allow admin to manage all conversations" on public.conversations
  for all to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

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
create policy "Allow select access for agents" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
      and (conversations.agent_id = auth.uid() or conversations.agent_id is null)
    )
  );

create policy "Allow insert access for agents" on public.messages
  for insert to authenticated with check (
    exists (
      select 1 from public.conversations
      where conversations.id = conversation_id
      and (conversations.agent_id = auth.uid() or conversations.agent_id is null)
    )
  );

create policy "Allow admin to manage all messages" on public.messages
  for all to authenticated using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

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
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ) with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
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

-- IVFFlat index for cosine similarity search
create index if not exists idx_knowledge_embeddings_embedding 
  on public.knowledge_embeddings 
  using ivfflat (embedding vector_cosine_ops) 
  with (lists = 100);


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


-- 9. Create Activity Logs Table for Auditing (Industry Standard)
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Activity Logs
alter table public.activity_logs enable row level security;

-- Policies for Activity Logs
create policy "Allow read access for authenticated users" on public.activity_logs
  for select to authenticated using (true);

create policy "Allow insert access for authenticated users" on public.activity_logs
  for insert to authenticated with check (true);

-- 10. Performance Optimization Indexes
create index if not exists idx_conversations_customer_id on public.conversations(customer_id);
create index if not exists idx_conversations_agent_id on public.conversations(agent_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_messages_created_at on public.messages(created_at asc);
create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
