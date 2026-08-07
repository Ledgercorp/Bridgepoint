-- Create table for Life Tasks Library
CREATE TABLE IF NOT EXISTS public.life_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  documents_needed TEXT[],
  what_to_expect TEXT,
  scripts TEXT,
  related_resource_categories TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (read-only for all users)
ALTER TABLE public.life_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Life tasks are viewable by everyone"
  ON public.life_tasks FOR SELECT
  USING (is_active = true);

-- Create table for Quick Tasks usage tracking (anonymous)
CREATE TABLE IF NOT EXISTS public.quick_task_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (anyone can log usage, admins can view)
ALTER TABLE public.quick_task_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log task usage"
  ON public.quick_task_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view task usage"
  ON public.quick_task_usage FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create table for Mini Lessons (Student Mode only)
CREATE TABLE IF NOT EXISTS public.mini_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scenario TEXT,
  reflection_question TEXT,
  practice_prompt TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (read-only for all users)
ALTER TABLE public.mini_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mini lessons are viewable by everyone"
  ON public.mini_lessons FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_life_tasks_updated_at
  BEFORE UPDATE ON public.life_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mini_lessons_updated_at
  BEFORE UPDATE ON public.mini_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();