-- Manual shortlist (favorites) for relationship hub; minimal schema + RLS.

create table if not exists public.user_shortlist (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  profile_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_shortlist_no_self check (owner_id <> profile_id),
  constraint user_shortlist_owner_profile_unique unique (owner_id, profile_id)
);

create index if not exists idx_user_shortlist_owner on public.user_shortlist (owner_id);

alter table public.user_shortlist enable row level security;

drop policy if exists "Users read own shortlist" on public.user_shortlist;
create policy "Users read own shortlist"
on public.user_shortlist
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Users insert own shortlist" on public.user_shortlist;
create policy "Users insert own shortlist"
on public.user_shortlist
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Users delete own shortlist" on public.user_shortlist;
create policy "Users delete own shortlist"
on public.user_shortlist
for delete
to authenticated
using (auth.uid() = owner_id);
