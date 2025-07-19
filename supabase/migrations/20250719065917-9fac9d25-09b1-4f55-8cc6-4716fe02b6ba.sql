-- Add deposit_balance column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC DEFAULT 0.000;

-- Create user_deposits table for tracking deposits
CREATE TABLE IF NOT EXISTS public.user_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    deposit_method TEXT NOT NULL DEFAULT 'bkash',
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_deposits
ALTER TABLE public.user_deposits ENABLE ROW LEVEL SECURITY;

-- Create policies for user_deposits
CREATE POLICY "Users can view their own deposits" 
ON public.user_deposits 
FOR SELECT 
USING (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create their own deposits" 
ON public.user_deposits 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin can manage all deposits" 
ON public.user_deposits 
FOR ALL 
USING (true);

-- Create balance_conversions table for tracking conversions from earning to deposit balance
CREATE TABLE IF NOT EXISTS public.balance_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount_converted NUMERIC NOT NULL,
    conversion_fee NUMERIC NOT NULL DEFAULT 0.1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on balance_conversions
ALTER TABLE public.balance_conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for balance_conversions
CREATE POLICY "Users can view their own conversions" 
ON public.balance_conversions 
FOR SELECT 
USING (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create conversions" 
ON public.balance_conversions 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin can manage all conversions" 
ON public.balance_conversions 
FOR ALL 
USING (true);

-- Add user_created column to tasks table to track user-uploaded tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_created BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by_user TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS admin_fee NUMERIC DEFAULT 0.01;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add new admin settings for the new features
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('bkash_rate', '120') ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('min_deposit_amount', '120') ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('min_conversion_amount', '1.0') ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('conversion_fee', '0.1') ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.admin_settings (setting_key, setting_value) VALUES 
('user_task_admin_fee', '0.01') ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updating user_deposits timestamps
CREATE TRIGGER update_user_deposits_updated_at
BEFORE UPDATE ON public.user_deposits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();