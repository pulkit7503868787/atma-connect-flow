-- ============================================================
-- AatmamIlan Settings, Plan Config & Admin Tables
-- ============================================================

-- 1. User Settings (privacy, notifications, controls)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_phone_share BOOLEAN DEFAULT false,
  allow_video_call BOOLEAN DEFAULT false,
  profile_visible BOOLEAN DEFAULT true,
  notifications_matches BOOLEAN DEFAULT true,
  notifications_messages BOOLEAN DEFAULT true,
  notifications_events BOOLEAN DEFAULT true,
  notifications_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Blocked Users
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blocks" ON public.blocked_users
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Plan Configuration (admin-controlled feature toggles)
CREATE TABLE IF NOT EXISTS public.plan_configs (
  plan_id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  can_chat BOOLEAN DEFAULT false,
  can_send_requests BOOLEAN DEFAULT true,
  daily_request_limit INTEGER DEFAULT 5,
  can_superlike BOOLEAN DEFAULT false,
  daily_superlike_limit INTEGER DEFAULT 0,
  can_see_who_liked BOOLEAN DEFAULT false,
  can_rsvp_events BOOLEAN DEFAULT false,
  can_video_call BOOLEAN DEFAULT false,
  has_matchmaker BOOLEAN DEFAULT false,
  has_verified_badge BOOLEAN DEFAULT false,
  can_view_full_astro BOOLEAN DEFAULT false,
  priority_in_discovery BOOLEAN DEFAULT false,
  validity_months INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan configs viewable by all" ON public.plan_configs FOR SELECT USING (true);
CREATE POLICY "Admin can manage plan configs" ON public.plan_configs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Seed default plan configs
INSERT INTO public.plan_configs (plan_id, plan_name, can_chat, can_send_requests, daily_request_limit, can_superlike, daily_superlike_limit, can_see_who_liked, can_rsvp_events, can_video_call, has_matchmaker, has_verified_badge, can_view_full_astro, priority_in_discovery, validity_months) VALUES
('seeker', 'Seeker (Free)', false, true, 5, false, 0, false, false, false, false, false, false, false, 3),
('sacred', 'Sacred (₹499)', true, true, 999, true, 3, true, true, true, false, true, true, true, 6),
('moksha', 'Moksha (₹1,499)', true, true, 999, true, 10, true, true, true, true, true, true, true, null)
ON CONFLICT (plan_id) DO NOTHING;

-- 4. Razorpay Configuration (admin only)
CREATE TABLE IF NOT EXISTS public.razorpay_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  key_id TEXT NOT NULL DEFAULT '',
  key_secret TEXT NOT NULL DEFAULT '',
  webhook_secret TEXT NOT NULL DEFAULT '',
  test_mode BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.razorpay_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage razorpay config" ON public.razorpay_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Insert default row
INSERT INTO public.razorpay_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 5. Add profile_hidden and deletion_requested columns to users table
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_hidden BOOLEAN DEFAULT false;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT false;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. Update subscriptions table - add valid_until if not exists
DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. Helper function to get user's effective plan features
CREATE OR REPLACE FUNCTION public.get_user_plan_features(user_uuid UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  can_chat BOOLEAN,
  can_send_requests BOOLEAN,
  daily_request_limit INTEGER,
  can_superlike BOOLEAN,
  daily_superlike_limit INTEGER,
  can_see_who_liked BOOLEAN,
  can_rsvp_events BOOLEAN,
  can_video_call BOOLEAN,
  has_matchmaker BOOLEAN,
  has_verified_badge BOOLEAN,
  can_view_full_astro BOOLEAN,
  priority_in_discovery BOOLEAN
) AS $$
DECLARE
  user_plan TEXT := 'seeker';
  sub_status TEXT := 'active';
BEGIN
  -- Get user's active subscription
  SELECT s.plan, s.status INTO user_plan, sub_status
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Map premium to sacred
  IF user_plan = 'premium' THEN
    user_plan := 'sacred';
  END IF;

  -- Return plan config
  RETURN QUERY
  SELECT 
    pc.plan_id,
    pc.plan_name,
    pc.can_chat,
    pc.can_send_requests,
    pc.daily_request_limit,
    pc.can_superlike,
    pc.daily_superlike_limit,
    pc.can_see_who_liked,
    pc.can_rsvp_events,
    pc.can_video_call,
    pc.has_matchmaker,
    pc.has_verified_badge,
    pc.can_view_full_astro,
    pc.priority_in_discovery
  FROM public.plan_configs pc
  WHERE pc.plan_id = COALESCE(user_plan, 'seeker');
END;
$$ LANGUAGE plpgsql;
