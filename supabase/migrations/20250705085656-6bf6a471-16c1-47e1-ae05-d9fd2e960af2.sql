-- Allow admin users to insert tasks
DROP POLICY IF EXISTS "Allow admin to manage tasks" ON public.tasks;

CREATE POLICY "Allow admin to manage tasks" 
ON public.tasks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add max_completions column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS max_completions INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_budget NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_completions INTEGER DEFAULT 0;