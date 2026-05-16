-- Sangha: merge teaching → meditation_audio; split gathering invitations into their own category.

update public.posts
set category = 'meditation_audio'
where category = 'teaching';

update public.posts
set category = 'gathering_invitation'
where category = 'satsang_experience'
  and (
    coalesce(trim(event_title), '') <> ''
    or event_starts_at is not null
  );

alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts add constraint posts_category_check check (
  category in (
    'reflection',
    'satsang_experience',
    'meditation_audio',
    'gathering_invitation'
  )
);

notify pgrst, 'reload schema';
