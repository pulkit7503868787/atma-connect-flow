-- Connection requests use public.matches (no public.likes table in deployed DB).
-- pending = one-way request; matched = mutual connection.

-- Canonical row shape: user1_id <= user2_id (text compare) so lookups/inserts stay consistent.
update public.matches
set
  user1_id = case when user1_id::text <= user2_id::text then user1_id else user2_id end,
  user2_id = case when user1_id::text <= user2_id::text then user2_id else user1_id end
where user1_id::text > user2_id::text;

alter table public.matches
  add column if not exists status text;

alter table public.matches
  add column if not exists requested_by uuid references public.users (id) on delete set null;

update public.matches
set status = 'matched'
where status is null;

alter table public.matches
  alter column status set not null;

alter table public.matches
  alter column status set default 'pending';

alter table public.matches drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check check (status in ('pending', 'matched'));

-- Allow authenticated users to create and update rows for pairs they belong to.
drop policy if exists "Users can insert match requests" on public.matches;

create policy "Users can insert match requests"
on public.matches
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (auth.uid() = user1_id or auth.uid() = user2_id)
  and user1_id <> user2_id
);

drop policy if exists "Users can update match rows for their pair" on public.matches;

create policy "Users can update match rows for their pair"
on public.matches
for update
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id)
with check (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can delete own pending request" on public.matches;

create policy "Users can delete own pending request"
on public.matches
for delete
to authenticated
using (status = 'pending' and requested_by = auth.uid());
