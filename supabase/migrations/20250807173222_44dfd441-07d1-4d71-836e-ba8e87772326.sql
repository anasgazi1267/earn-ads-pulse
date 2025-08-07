-- Fix the increment_ads_watched function to use proper security and search path
CREATE OR REPLACE FUNCTION increment_ads_watched(user_telegram_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET 
    ads_watched_today = CASE 
      WHEN last_activity_date = CURRENT_DATE THEN ads_watched_today + 1
      ELSE 1
    END,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE telegram_id = user_telegram_id;
END;
$$;