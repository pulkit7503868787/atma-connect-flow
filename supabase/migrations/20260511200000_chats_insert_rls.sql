-- Allow matched users to create chat rows (previously only SELECT existed on public.chats).
drop policy if exists "Users can create chats when matched" on public.chats;

create policy "Users can create chats when matched"
on public.chats
for insert
to authenticated
with check (
  user1_id <> user2_id
  and (auth.uid() = user1_id or auth.uid() = user2_id)
  and exists (
    select 1
    from public.matches m
    where (m.status = 'matched' or m.status is null)
      and (
        (m.user1_id = user1_id and m.user2_id = user2_id)
        or (m.user1_id = user2_id and m.user2_id = user1_id)
      )
  )
);
