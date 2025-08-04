-- Add device verification settings to admin_settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES ('device_verification_enabled', 'true') ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO admin_settings (setting_key, setting_value) VALUES ('monetization_code', '') ON CONFLICT (setting_key) DO NOTHING;

-- Update user_device_tracking table to store first registered account
ALTER TABLE user_device_tracking 
ADD COLUMN IF NOT EXISTS first_account_telegram_id text,
ADD COLUMN IF NOT EXISTS total_accounts_attempted integer DEFAULT 1;