-- Birth details for astro matching (ISO date + time text + place text)
alter table public.users add column if not exists birth_date date;
alter table public.users add column if not exists birth_time text;
alter table public.users add column if not exists birth_place text;

notify pgrst, 'reload schema';
