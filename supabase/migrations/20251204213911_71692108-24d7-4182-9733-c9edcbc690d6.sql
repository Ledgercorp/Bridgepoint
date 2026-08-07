-- Create team board tasks table
CREATE TABLE public.team_board_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  assigned_to uuid,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create team board notes/comments
CREATE TABLE public.team_board_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.team_board_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_board_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_board_comments ENABLE ROW LEVEL SECURITY;

-- Task policies: org members can view/manage
CREATE POLICY "Org members can view tasks"
ON public.team_board_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = team_board_tasks.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can create tasks"
ON public.team_board_tasks FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = team_board_tasks.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can update tasks"
ON public.team_board_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = team_board_tasks.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Task creators can delete"
ON public.team_board_tasks FOR DELETE
USING (auth.uid() = created_by);

-- Comment policies
CREATE POLICY "Org members can view comments"
ON public.team_board_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_board_tasks t
    JOIN organization_members om ON om.organization_id = t.organization_id
    WHERE t.id = team_board_comments.task_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org members can add comments"
ON public.team_board_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM team_board_tasks t
    JOIN organization_members om ON om.organization_id = t.organization_id
    WHERE t.id = team_board_comments.task_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Comment authors can delete"
ON public.team_board_comments FOR DELETE
USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_team_board_tasks_updated_at
  BEFORE UPDATE ON public.team_board_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_board_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_board_comments;