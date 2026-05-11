-- Idempotent: safe if 20260512140000_spiritual_profile_compatibility.sql already ran.
-- Use when PostgREST reports missing columns (e.g. marriage_timeline) on public.users.

alter table public.users add column if not exists spiritual_path text;
alter table public.users add column if not exists programs_undergone text[] not null default '{}';
alter table public.users add column if not exists sadhana_frequency text;
alter table public.users add column if not exists spiritual_values text[] not null default '{}';
alter table public.users add column if not exists meditation_experience text;
alter table public.users add column if not exists seva_inclination text;
alter table public.users add column if not exists guru_notes text;
alter table public.users add column if not exists guru_photo_url text;

alter table public.users add column if not exists marriage_timeline text;
alter table public.users add column if not exists marital_status text;
alter table public.users add column if not exists children_preference text;
alter table public.users add column if not exists relocation_openness text;
alter table public.users add column if not exists family_orientation text;

alter table public.users add column if not exists languages text[] not null default '{}';
alter table public.users add column if not exists smoking_habit text;
alter table public.users add column if not exists drinking_habit text;
alter table public.users add column if not exists daily_rhythm text;

alter table public.users add column if not exists religion text;
alter table public.users add column if not exists caste text;
alter table public.users add column if not exists nakshatra text;
alter table public.users add column if not exists gothram text;

alter table public.users add column if not exists occupation text;
alter table public.users add column if not exists education text;
alter table public.users add column if not exists income_range text;
alter table public.users add column if not exists height_cm integer;
alter table public.users add column if not exists family_details text;

alter table public.users add column if not exists verification_status text not null default 'unverified';
alter table public.users drop constraint if exists users_verification_status_check;
alter table public.users add constraint users_verification_status_check
  check (verification_status in ('unverified', 'pending', 'verified'));

alter table public.users add column if not exists whatsapp_number text;
alter table public.users add column if not exists call_preference text;

create or replace function public.get_matched_contact_fields(p_other uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_ok boolean;
begin
  if v_me is null or p_other is null then
    return jsonb_build_object('whatsapp_number', null, 'call_preference', null);
  end if;

  select exists (
    select 1
    from public.matches m
    where m.status = 'matched'
      and (
        (m.user1_id = v_me and m.user2_id = p_other)
        or (m.user2_id = v_me and m.user1_id = p_other)
      )
  )
  into v_ok;

  if not coalesce(v_ok, false) then
    return jsonb_build_object('whatsapp_number', null, 'call_preference', null);
  end if;

  return (
    select jsonb_build_object(
      'whatsapp_number', nullif(trim(coalesce(u.whatsapp_number, '')), ''),
      'call_preference', nullif(trim(coalesce(u.call_preference, '')), '')
    )
    from public.users u
    where u.id = p_other
  );
end;
$$;

revoke all on function public.get_matched_contact_fields(uuid) from public;
grant execute on function public.get_matched_contact_fields(uuid) to authenticated;

notify pgrst, 'reload schema';
