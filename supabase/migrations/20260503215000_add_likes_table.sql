-- Step 7: Likes table for mutual matchmaking flow

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid not null references public.users (id) on delete cascade,
  liked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self_like check (liker_id <> liked_id),
  constraint likes_unique_pair unique (liker_id, liked_id)
);

create index if not exists idx_likes_liker_id on public.likes (liker_id);
create index if not exists idx_likes_liked_id on public.likes (liked_id);

alter table public.likes enable row level security;

drop policy if exists "Users can read related likes" on public.likes;
create policy "Users can read related likes"
  on public.likes
  for select
  to authenticated
  using (auth.uid() = liker_id or auth.uid() = liked_id);

drop policy if exists "Users can create own likes" on public.likes;
create policy "Users can create own likes"
  on public.likes
  for insert
  to authenticated
  with check (auth.uid() = liker_id);
