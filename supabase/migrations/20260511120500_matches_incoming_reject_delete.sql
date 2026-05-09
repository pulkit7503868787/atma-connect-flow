-- Allow recipient to delete an incoming pending request (reject).
drop policy if exists "Users can delete incoming pending request" on public.matches;

create policy "Users can delete incoming pending request"
on public.matches
for delete
to authenticated
using (
  status = 'pending'
  and requested_by is not null
  and requested_by <> auth.uid()
  and (auth.uid() = user1_id or auth.uid() = user2_id)
);
