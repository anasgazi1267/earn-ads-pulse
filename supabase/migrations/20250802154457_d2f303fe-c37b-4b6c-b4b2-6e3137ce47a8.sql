-- Create payment methods table for admin to manage deposit/withdrawal options
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'deposit' or 'withdrawal'
  platform TEXT NOT NULL, -- 'binance', 'payeer', 'bkash', etc.
  admin_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  instructions TEXT,
  min_amount NUMERIC DEFAULT 0,
  max_amount NUMERIC,
  exchange_rate NUMERIC DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create IP tracking table for one device per account
CREATE TABLE IF NOT EXISTS public.user_device_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,
  user_agent TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ip_address)
);

-- Add deposit balance tracking to user_deposits
ALTER TABLE public.user_deposits 
ADD COLUMN IF NOT EXISTS converted_from_earnings BOOLEAN DEFAULT false;

-- Add new admin settings for ad control and payment methods
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('ad_interval_seconds', '20'),
('binance_admin_id', '787819330'),
('payeer_admin_id', 'P1102512228'),
('min_task_cpc', '0.005'),
('min_task_budget', '1.0'),
('banner_ad_code', ''),
('popup_ad_code', ''),
('footer_ad_code', ''),
('sidebar_ad_code', '')
ON CONFLICT (setting_key) DO UPDATE SET 
setting_value = EXCLUDED.setting_value;

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, platform, admin_id, display_name, instructions, min_amount, exchange_rate) VALUES 
('Binance Pay', 'both', 'binance', '787819330', 'Binance Pay (USDT)', 'Send USDT to admin Binance Pay ID: 787819330', 1.0, 1.0),
('Payeer', 'both', 'payeer', 'P1102512228', 'Payeer (USD)', 'Send USD to admin Payeer ID: P1102512228', 1.0, 1.0)
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_device_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for payment methods
CREATE POLICY "Everyone can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (true);

-- Create policies for device tracking
CREATE POLICY "Admin can manage device tracking" 
ON public.user_device_tracking 
FOR ALL 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_device_tracking_updated_at
BEFORE UPDATE ON public.user_device_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();