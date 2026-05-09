-- Step 3: Core SaaS schema for Supabase
-- Clean & fixed version

-- Extensions
create extension if not exists "pgcrypto";

-- USERS
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  guru text,
  practices text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now()
);

-- MATCHES
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.users(id) on delete cascade,
  user2_id uuid not null references public.users(id) on delete cascade,
  compatibility_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint matches_distinct_users check (user1_id <> user2_id)
);

-- FIXED UNIQUE INDEX (matches)
create unique index matches_unique_pair_idx 
on public.matches (
  LEAST(user1_id, user2_id),
  GREATEST(user1_id, user2_id)
);

-- CHATS
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.users (id) on delete cascade,
  user2_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chats_distinct_users check (user1_id <> user2_id)
);

-- FIXED UNIQUE INDEX (chats)
create unique index chats_unique_pair_idx 
on public.chats (
  LEAST(user1_id, user2_id),
  GREATEST(user1_id, user2_id)
);

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_non_empty_content check (char_length(trim(content)) > 0)
);

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_check check (plan in ('free', 'pro', 'premium')),
  constraint subscriptions_status_check check (status in ('active', 'past_due', 'canceled'))
);

-- INDEXES (performance)
create index if not exists idx_matches_user1_id on public.matches (user1_id);
create index if not exists idx_matches_user2_id on public.matches (user2_id);
create index if not exists idx_chats_user1_id on public.chats (user1_id);
create index if not exists idx_chats_user2_id on public.chats (user2_id);
create index if not exists idx_messages_chat_id_created_at on public.messages (chat_id, created_at desc);
create index if not exists idx_messages_sender_id on public.messages (sender_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

-- AUTO CREATE USER PROFILE AFTER SIGNUP
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- ENABLE RLS
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

-- POLICIES

-- USERS
create policy "Users can read own profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- MATCHES
create policy "Users can read matches"
on public.matches
for select
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

-- CHATS
create policy "Users can read chats"
on public.chats
for select
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

-- MESSAGES READ
create policy "Users can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.chats c
    where c.id = chat_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- MESSAGES SEND
create policy "Users can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chats c
    where c.id = chat_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- SUBSCRIPTIONS
create policy "Users can read own subscription"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);
