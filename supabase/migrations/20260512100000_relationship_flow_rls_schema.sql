-- Relationship / discovery flow: passes FK repair, reports, super_likes, diet/lifestyle,
-- discovery read on users, event RSVP uniqueness, community post images bucket.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS patterns.

-- ─── public.users: diet & lifestyle (editable profile fields) ───
alter table public.users
  add column if not exists diet text;

alter table public.users
  add column if not exists lifestyle text;

-- Allow authenticated users to read non-blocked profiles (discovery / chat / community).
-- Complements "Users can read own profile" (policies are OR-combined for SELECT).
drop policy if exists "Users can read discoverable profiles" on public.users;

create policy "Users can read discoverable profiles"
on public.users
for select
to authenticated
using (coalesce(is_blocked, false) = false);

-- ─── passes: table + correct FKs to public.users ───
create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  passed_user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint passes_no_self check (user_id <> passed_user_id)
);

create unique index if not exists passes_user_passed_unique
  on public.passes (user_id, passed_user_id);

-- Re-bind FKs to public.users (fixes mis-pointed or legacy constraint names).
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'passes'
      and c.contype = 'f'
  loop
    execute format('alter table public.passes drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.passes drop constraint if exists passes_user_id_fkey;
alter table public.passes drop constraint if exists passes_passed_user_id_fkey;
alter table public.passes drop constraint if exists passes_passed_user_foreign_constraint_key;

alter table public.passes
  add constraint passes_user_id_fkey
  foreign key (user_id) references public.users (id) on delete cascade;

alter table public.passes
  add constraint passes_passed_user_id_fkey
  foreign key (passed_user_id) references public.users (id) on delete cascade;

alter table public.passes enable row level security;

drop policy if exists "Users read own passes" on public.passes;
create policy "Users read own passes"
on public.passes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own passes" on public.passes;
create policy "Users insert own passes"
on public.passes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own passes" on public.passes;
create policy "Users update own passes"
on public.passes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own passes" on public.passes;
create policy "Users delete own passes"
on public.passes
for delete
to authenticated
using (auth.uid() = user_id);

-- ─── reports ───
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  reported_id uuid not null references public.users (id) on delete cascade,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint reports_no_self check (reporter_id <> reported_id)
);

create unique index if not exists reports_reporter_reported_unique
  on public.reports (reporter_id, reported_id);

alter table public.reports enable row level security;

drop policy if exists "Users insert own reports" on public.reports;
create policy "Users insert own reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.reports;
create policy "Users read own reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id);

-- ─── super_likes ───
create table if not exists public.super_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  liked_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint super_likes_no_self check (user_id <> liked_user_id)
);

create index if not exists idx_super_likes_user_created on public.super_likes (user_id, created_at desc);

alter table public.super_likes enable row level security;

drop policy if exists "Users read related super_likes" on public.super_likes;
create policy "Users read related super_likes"
on public.super_likes
for select
to authenticated
using (auth.uid() = user_id or auth.uid() = liked_user_id);

drop policy if exists "Users insert own super_likes" on public.super_likes;
create policy "Users insert own super_likes"
on public.super_likes
for insert
to authenticated
with check (auth.uid() = user_id);

-- ─── event_rsvps: unique pair for upsert (table may be created outside this repo) ───
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'event_rsvps'
  ) then
    create unique index if not exists event_rsvps_event_user_unique
      on public.event_rsvps (event_id, user_id);
  end if;
end $$;

-- ─── Community post images (public read; uploads under {uid}/…) ───
insert into storage.buckets (id, name, public)
values ('community-posts', 'community-posts', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read community posts images" on storage.objects;
create policy "Public read community posts images"
on storage.objects
for select
to public
using (bucket_id = 'community-posts');

drop policy if exists "Users insert own community post images" on storage.objects;
create policy "Users insert own community post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own community post images" on storage.objects;
create policy "Users update own community post images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own community post images" on storage.objects;
create policy "Users delete own community post images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-posts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
