-- ==============================================================================
-- FS-GenAI Assessment: Database Schema, RLS Policies, and RPC Function
-- Task 1 (Core Supabase: RLS + RPC) & Task 2 (Login Audit Log)
-- ==============================================================================

-- 1. Table for recording user logins (Task 2)
create table if not exists public.login_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz default now() not null
);

-- 2. Enable Row Level Security (Task 1 - RLS)
alter table public.login_logs enable row level security;

-- Policy 1: Authenticated users can insert their own login record
create policy "Users can insert own login"
on public.login_logs
for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy 2: Authenticated users can view all login records
create policy "Authenticated users can view logins"
on public.login_logs
for select
to authenticated
using (true);

-- 3. RPC Function to fetch recent logins (Task 1 - RPC)
create or replace function public.get_recent_logins()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  logged_in_at timestamptz
)
language sql
security invoker
as $$
  select id, email, full_name, avatar_url, logged_in_at
  from public.login_logs
  order by logged_in_at desc
  limit 50;
$$;

-- 4. Enable Supabase Realtime Replication on login_logs (Option A: Realtime)
alter publication supabase_realtime add table public.login_logs;


