-- Step 10: Basic monetization (free vs premium)

-- Normalize legacy plan values
update public.subscriptions
set plan = 'premium'
where plan not in ('free', 'premium');

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'premium'));
