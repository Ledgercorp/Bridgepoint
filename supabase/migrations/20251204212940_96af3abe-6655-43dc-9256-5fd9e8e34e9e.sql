-- Create organization shared resources table for ORES
CREATE TABLE public.organization_shared_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  resource_data jsonb NOT NULL DEFAULT '{}',
  resource_type text NOT NULL DEFAULT 'resource',
  title text NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_shared_resources ENABLE ROW LEVEL SECURITY;

-- Org members can view shared resources
CREATE POLICY "Org members can view shared resources"
ON public.organization_shared_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_shared_resources.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Org members can create shared resources
CREATE POLICY "Org members can create shared resources"
ON public.organization_shared_resources
FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_shared_resources.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Org members can update their own shared resources
CREATE POLICY "Org members can update own shared resources"
ON public.organization_shared_resources
FOR UPDATE
USING (
  auth.uid() = shared_by OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_shared_resources.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Org members can delete their own shared resources or admins can delete any
CREATE POLICY "Org members can delete own shared resources"
ON public.organization_shared_resources
FOR DELETE
USING (
  auth.uid() = shared_by OR
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organization_shared_resources.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_organization_shared_resources_updated_at
  BEFORE UPDATE ON public.organization_shared_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for ORES
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_shared_resources;