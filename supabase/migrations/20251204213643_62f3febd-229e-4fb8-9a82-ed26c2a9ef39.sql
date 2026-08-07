-- Create workflow library table for saved workflows
CREATE TABLE public.workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  workflow_data jsonb NOT NULL DEFAULT '{}',
  is_shared boolean NOT NULL DEFAULT false,
  use_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own workflows
CREATE POLICY "Users can view own workflows"
ON public.workflow_templates FOR SELECT
USING (auth.uid() = created_by);

-- Users can view shared org workflows
CREATE POLICY "Users can view shared org workflows"
ON public.workflow_templates FOR SELECT
USING (
  is_shared = true AND
  organization_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = workflow_templates.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Users can create workflows
CREATE POLICY "Users can create workflows"
ON public.workflow_templates FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update own workflows
CREATE POLICY "Users can update own workflows"
ON public.workflow_templates FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete own workflows
CREATE POLICY "Users can delete own workflows"
ON public.workflow_templates FOR DELETE
USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();