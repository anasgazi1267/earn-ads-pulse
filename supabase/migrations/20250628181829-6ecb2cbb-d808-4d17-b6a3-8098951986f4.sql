
-- Drop existing tables if they exist to recreate them properly
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;

-- Create admin_settings table for real-time admin control
CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
('ad_reward_rate', '0.050'),
('referral_rate', '10'),
('min_withdrawal', '1.0'),
('daily_ad_limit', '30'),
('daily_spin_limit', '30'),
('spin_win_percentage', '15'),
('required_referrals', '5'),
('channel_verification_enabled', 'true'),
('html_ad_code', ''),
('monetag_banner_code', '');

-- Create users table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id text NOT NULL UNIQUE,
  username text,
  first_name text,
  last_name text,
  balance numeric DEFAULT 0.000,
  referral_count integer DEFAULT 0,
  channels_joined boolean DEFAULT false,
  channel_join_date timestamp with time zone,
  ads_watched_today integer DEFAULT 0,
  spins_used_today integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  referred_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_telegram_id text NOT NULL,
  referred_telegram_id text NOT NULL,
  earnings numeric DEFAULT 0.000,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(referrer_telegram_id, referred_telegram_id)
);

-- Create user_activities table for tracking daily activities
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id text NOT NULL,
  activity_type text NOT NULL, -- 'ad_watch', 'spin', 'referral_earn'
  amount numeric DEFAULT 0.000,
  activity_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id text NOT NULL,
  username text NOT NULL,
  amount numeric NOT NULL,
  withdrawal_method text NOT NULL,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow public access (since this is a Telegram bot app)
CREATE POLICY "Allow all access to admin_settings" ON public.admin_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access to referrals" ON public.referrals FOR ALL USING (true);
CREATE POLICY "Allow all access to user_activities" ON public.user_activities FOR ALL USING (true);
CREATE POLICY "Allow all access to withdrawal_requests" ON public.withdrawal_requests FOR ALL USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;

-- Set replica identity for realtime updates
ALTER TABLE public.admin_settings REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.referrals REPLICA IDENTITY FULL;
ALTER TABLE public.user_activities REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
