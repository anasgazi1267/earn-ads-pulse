
-- Create channels table for managing required channels
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  subscribers_count TEXT DEFAULT '0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updating updated_at column
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active channels" ON public.channels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage channels" ON public.channels
  FOR ALL USING (true);

-- Insert default channels
INSERT INTO public.channels (name, url, description, logo_url, subscribers_count, display_order) VALUES
('Anas Earn Hunter', 'https://t.me/AnasEarnHunter', 'Premium Earning Opportunities', '/lovable-uploads/ee5a5260-f02b-4a99-b6b5-139e89cf3261.png', '15K+', 1),
('Exposs Dark', 'https://t.me/ExpossDark', 'Dark Web & Security Tips', '/lovable-uploads/4e3fe131-80b5-4522-8e01-86c7d4a52f0b.png', '8K+', 2),
('Technical Anas', 'https://t.me/TechnicalAnas', 'Technical Tutorials & Tips', '/lovable-uploads/cf2c5d17-4c7b-49a0-8d98-7b0a557f35b1.png', '12K+', 3),
('Anas Promotion', 'https://t.me/Anas_Promotion', 'Latest Promotions & Offers', '/lovable-uploads/8e0c3b55-4829-4ae7-9750-614619b6a3a5.png', '6K+', 4);

-- Create storage bucket for channel logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'channel-logos',
  'channel-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for channel logos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'channel-logos');
CREATE POLICY "Admin can upload channel logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'channel-logos');
CREATE POLICY "Admin can update channel logos" ON storage.objects FOR UPDATE USING (bucket_id = 'channel-logos');
CREATE POLICY "Admin can delete channel logos" ON storage.objects FOR DELETE USING (bucket_id = 'channel-logos');
