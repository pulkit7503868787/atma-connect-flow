-- Subscriptions: allow moksha + seeker (admin UI) alongside legacy free/premium
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'seeker', 'premium', 'moksha'));

-- Sangha posts: merge categories, drop chanting; add unified satsang / experience
update public.posts set category = 'satsang_experience' where category in ('satsang', 'event');
update public.posts set category = 'reflection' where category = 'chanting';

alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts add constraint posts_category_check check (
  category in (
    'reflection',
    'satsang_experience',
    'meditation_audio',
    'teaching'
  )
);

-- Hide specific authors from one's feed (viewer chooses)
create table if not exists public.post_feed_hides (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references auth.users (id) on delete cascade,
  hidden_author_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (viewer_id, hidden_author_id),
  constraint post_feed_hides_no_self check (viewer_id <> hidden_author_id)
);

alter table public.post_feed_hides enable row level security;

drop policy if exists "Users manage own feed hides" on public.post_feed_hides;
create policy "Users manage own feed hides"
on public.post_feed_hides
for all
to authenticated
using (auth.uid() = viewer_id)
with check (auth.uid() = viewer_id);

create index if not exists idx_post_feed_hides_viewer on public.post_feed_hides (viewer_id);

-- Optional profile gallery (URLs/paths in storage); primary avatar stays on avatar_url
alter table public.users add column if not exists profile_gallery_urls jsonb not null default '[]'::jsonb;

-- Contact visibility: honour other user's sharing preferences for matched souls
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
    return jsonb_build_object('whatsapp_number', null, 'call_preference', null, 'allow_phone_share', false, 'allow_video_call', false);
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
    return jsonb_build_object('whatsapp_number', null, 'call_preference', null, 'allow_phone_share', false, 'allow_video_call', false);
  end if;

  return (
    select jsonb_build_object(
      'whatsapp_number',
        case
          when coalesce(s.allow_phone_share, false) then nullif(trim(coalesce(u.whatsapp_number, '')), '')
          else null
        end,
      'call_preference',
        case
          when coalesce(s.allow_phone_share, false) then nullif(trim(coalesce(u.call_preference, '')), '')
          else null
        end,
      'allow_phone_share', coalesce(s.allow_phone_share, false),
      'allow_video_call', coalesce(s.allow_video_call, false)
    )
    from public.users u
    left join public.user_settings s on s.user_id = u.id
    where u.id = p_other
  );
end;
$$;

revoke all on function public.get_matched_contact_fields(uuid) from public;
grant execute on function public.get_matched_contact_fields(uuid) to authenticated;

-- Plan display names (amounts are enforced in app + payment edge; configs label for admin UI)
update public.plan_configs
set plan_name = 'Sacred (₹4,899)', updated_at = now()
where plan_id = 'sacred';

update public.plan_configs
set plan_name = 'Moksha (₹9,999)', updated_at = now()
where plan_id = 'moksha';

update public.users set guru = 'radhasoami' where guru in ('ramana', 'iskcon');

-- App uses "cancelled"; legacy constraint used American spelling
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'past_due', 'canceled', 'cancelled'));

notify pgrst, 'reload schema';
