-- Step 15: Admin roster + moderation flags

alter table public.users
  add column if not exists is_blocked boolean not null default false;

alter table public.users
  add column if not exists chat_disabled boolean not null default false;

create table if not exists public.admin_users (
  user_id uuid primary key references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Users can see own admin row" on public.admin_users;
create policy "Users can see own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin () to authenticated;

-- Admins: broader read/update on users, subscriptions, messages
drop policy if exists "Admins select all users" on public.users;
create policy "Admins select all users"
on public.users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins update user moderation" on public.users;
create policy "Admins update user moderation"
on public.users
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins select all subscriptions" on public.subscriptions;
create policy "Admins select all subscriptions"
on public.subscriptions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins select all messages" on public.messages;
create policy "Admins select all messages"
on public.messages
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins delete messages" on public.messages;
create policy "Admins delete messages"
on public.messages
for delete
to authenticated
using (public.is_admin());

-- First admin (run once in SQL editor with a real user id from public.users):
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
