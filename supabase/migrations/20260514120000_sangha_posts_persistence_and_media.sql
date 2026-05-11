-- Sangha / community: durable likes & comments, post categories, media columns.
-- Counts are maintained by triggers (no client RPC required).

-- ─── posts (create or extend) ───
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null default '',
  image_url text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists category text not null default 'reflection';
alter table public.posts add column if not exists image_urls jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists audio_url text;
alter table public.posts add column if not exists video_url text;
alter table public.posts add column if not exists event_title text;
alter table public.posts add column if not exists event_starts_at timestamptz;
alter table public.posts add column if not exists event_location text;
alter table public.posts add column if not exists event_link text;
alter table public.posts add column if not exists cover_image_url text;

alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check check (
  category in (
    'reflection',
    'satsang',
    'event',
    'chanting',
    'meditation_audio',
    'teaching'
  )
);

-- Backfill gallery from legacy single image
update public.posts
set image_urls = case
  when image_url is not null and trim(image_url) <> '' then jsonb_build_array(trim(image_url))
  else '[]'::jsonb
end
where image_urls = '[]'::jsonb
  and image_url is not null
  and trim(image_url) <> '';

-- ─── post_likes ───
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_unique unique (post_id, user_id)
);

create index if not exists idx_post_likes_post_id on public.post_likes (post_id);
create index if not exists idx_post_likes_user_id on public.post_likes (user_id);

-- ─── post_comments ───
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_content_nonempty check (char_length(trim(content)) > 0)
);

create index if not exists idx_post_comments_post_id on public.post_comments (post_id);

-- ─── Triggers: keep denormalized counts accurate ───
create or replace function public._post_likes_count_ins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public._post_likes_count_del()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists tr_post_likes_ins on public.post_likes;
create trigger tr_post_likes_ins
after insert on public.post_likes
for each row execute procedure public._post_likes_count_ins();

drop trigger if exists tr_post_likes_del on public.post_likes;
create trigger tr_post_likes_del
after delete on public.post_likes
for each row execute procedure public._post_likes_count_del();

create or replace function public._post_comments_count_ins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public._post_comments_count_del()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists tr_post_comments_ins on public.post_comments;
create trigger tr_post_comments_ins
after insert on public.post_comments
for each row execute procedure public._post_comments_count_ins();

drop trigger if exists tr_post_comments_del on public.post_comments;
create trigger tr_post_comments_del
after delete on public.post_comments
for each row execute procedure public._post_comments_count_del();

-- Reconcile counts from truth (fixes historical drift)
update public.posts p
set likes_count = coalesce((select count(*)::int from public.post_likes l where l.post_id = p.id), 0);

update public.posts p
set comments_count = coalesce((select count(*)::int from public.post_comments c where c.post_id = p.id), 0);

-- Drop legacy RPCs if present (client uses triggers only now)
drop function if exists public.increment_post_likes(uuid);
drop function if exists public.decrement_post_likes(uuid);
drop function if exists public.increment_post_comments(uuid);

-- ─── RLS ───
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Posts readable by authenticated" on public.posts;
create policy "Posts readable by authenticated"
on public.posts for select
to authenticated
using (true);

drop policy if exists "Users insert own posts" on public.posts;
create policy "Users insert own posts"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts"
on public.posts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users read own post likes" on public.post_likes;
create policy "Users read own post likes"
on public.post_likes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own post likes" on public.post_likes;
create policy "Users insert own post likes"
on public.post_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users delete own post likes" on public.post_likes;
create policy "Users delete own post likes"
on public.post_likes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Authenticated read post comments" on public.post_comments;
create policy "Authenticated read post comments"
on public.post_comments for select
to authenticated
using (true);

drop policy if exists "Users insert own post comments" on public.post_comments;
create policy "Users insert own post comments"
on public.post_comments for insert
to authenticated
with check (auth.uid() = user_id);
