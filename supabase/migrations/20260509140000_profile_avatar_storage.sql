-- Profile fields + public avatar storage (nullable columns preserve existing rows)

alter table public.users
  add column if not exists age integer,
  add column if not exists city text,
  add column if not exists avatar_url text;

-- Bucket for profile photos (public read; uploads scoped per-user folder in policies)
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

-- Storage policies
drop policy if exists "Public read profile images" on storage.objects;
create policy "Public read profile images"
on storage.objects
for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Users insert own profile images" on storage.objects;
create policy "Users insert own profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own profile images" on storage.objects;
create policy "Users update own profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own profile images" on storage.objects;
create policy "Users delete own profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
