-- Chat message attachments: optional image/PDF + public chat-media bucket.

alter table public.messages drop constraint if exists messages_non_empty_content;

alter table public.messages add column if not exists attachment_url text;
alter table public.messages add column if not exists attachment_type text;

alter table public.messages drop constraint if exists messages_attachment_type_chk;
alter table public.messages add constraint messages_attachment_type_chk check (
  attachment_type is null or attachment_type in ('image', 'file')
);

alter table public.messages drop constraint if exists messages_body_nonempty;
alter table public.messages add constraint messages_body_nonempty check (
  length(trim(coalesce(content, ''))) > 0
  or (
    attachment_url is not null
    and length(trim(attachment_url)) > 0
  )
);

-- Bucket: public read; uploads only under first folder = auth.uid()
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read chat media" on storage.objects;
create policy "Public read chat media"
on storage.objects for select to public
using (bucket_id = 'chat-media');

drop policy if exists "Users upload chat media own prefix" on storage.objects;
create policy "Users upload chat media own prefix"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own chat media" on storage.objects;
create policy "Users update own chat media"
on storage.objects for update to authenticated
using (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own chat media" on storage.objects;
create policy "Users delete own chat media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'chat-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
