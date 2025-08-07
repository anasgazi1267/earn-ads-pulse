-- Add platform fee and conversion fee admin settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
('platform_fee_percentage', '0.005'),
('conversion_fee_percentage', '0.1')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Add HTML ads admin setting
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
('html_ads', '[]')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Create balance_conversions table if not exists (for tracking admin earnings)
CREATE TABLE IF NOT EXISTS balance_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_converted NUMERIC NOT NULL,
  conversion_fee NUMERIC NOT NULL DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on balance_conversions
ALTER TABLE balance_conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for balance_conversions
CREATE POLICY "Admin can manage all conversions" ON balance_conversions FOR ALL USING (true);
CREATE POLICY "Users can view their own conversions" ON balance_conversions FOR SELECT USING (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can create conversions" ON balance_conversions FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id IN (SELECT telegram_id FROM users WHERE id = auth.uid()));

-- Add admin_fee column to tasks table for tracking platform earnings
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS admin_fee NUMERIC DEFAULT 0.01;

-- Update existing tasks to have admin fee
UPDATE tasks SET admin_fee = 0.01 WHERE admin_fee IS NULL;