-- Add onboarding completion fields without breaking existing users
alter table public.users
  add column if not exists gender text;

alter table public.users
  add column if not exists seeking_gender text;

alter table public.users
  add column if not exists age integer;

alter table public.users
  add column if not exists city text;

alter table public.users
  add column if not exists onboarding_completed boolean not null default false;

-- Backfill completion flag only for rows that already satisfy requirements
update public.users
set onboarding_completed = true
where
  coalesce(nullif(trim(gender), ''), '') <> ''
  and coalesce(nullif(trim(seeking_gender), ''), '') <> ''
  and age is not null
  and coalesce(nullif(trim(city), ''), '') <> ''
  and coalesce(nullif(trim(bio), ''), '') <> ''
  and coalesce(nullif(trim(guru), ''), '') <> ''
  and array_length(practices, 1) > 0;
