-- Step 9: Notifications table

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  reference_id uuid,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('like', 'match', 'message'))
);

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_user_id_seen on public.notifications (user_id, seen);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Authenticated users can insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);
