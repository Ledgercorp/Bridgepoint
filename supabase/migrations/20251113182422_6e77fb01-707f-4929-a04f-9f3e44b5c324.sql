-- Create table for task reminders
CREATE TABLE IF NOT EXISTS public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'saved_step', 'phone_script', 'quick_task', etc.
  task_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own reminders"
  ON public.task_reminders FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_task_reminders_updated_at
  BEFORE UPDATE ON public.task_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for recent activity (for My Hub)
CREATE TABLE IF NOT EXISTS public.recent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'resource_view', 'task_complete', 'quick_task_use', etc.
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  item_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_recent_activity_user_created ON public.recent_activity(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.recent_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activity"
  ON public.recent_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON public.recent_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Limit activity history to 100 most recent items per user
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.recent_activity
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.recent_activity
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_activity
  AFTER INSERT ON public.recent_activity
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_activity();