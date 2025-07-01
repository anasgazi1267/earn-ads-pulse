
-- Create tasks table for admin to manage tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('telegram_join', 'telegram_channel', 'youtube_subscribe', 'website_visit', 'social_follow')),
  task_url TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0.01,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_tasks table to track completed tasks
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_earned NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(user_id, task_id)
);

-- Create trigger for updating updated_at column
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS (no policies needed as tasks are public read, admin write only)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks (everyone can read, but we'll control admin access in code)
CREATE POLICY "Everyone can view active tasks" ON public.tasks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view their completed tasks" ON public.user_tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can complete tasks" ON public.user_tasks
  FOR INSERT WITH CHECK (true);
