-- Create shared_bundle_access table to link bundles to organizations
CREATE TABLE IF NOT EXISTS public.shared_bundle_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.resource_bundles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(bundle_id, organization_id)
);

-- Enable RLS on shared_bundle_access
ALTER TABLE public.shared_bundle_access ENABLE ROW LEVEL SECURITY;

-- Organization admins can share bundles with their organization
CREATE POLICY "Org admins can share bundles"
ON public.shared_bundle_access
FOR INSERT
TO authenticated
WITH CHECK (
  shared_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = shared_bundle_access.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
  )
  AND EXISTS (
    SELECT 1 FROM public.resource_bundles
    WHERE resource_bundles.id = shared_bundle_access.bundle_id
      AND resource_bundles.user_id = auth.uid()
  )
);

-- Organization admins can view their shared bundles
CREATE POLICY "Org admins can view shared bundles"
ON public.shared_bundle_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = shared_bundle_access.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
  )
);

-- Connected community users can view bundles shared with their organization
CREATE POLICY "Connected users can view shared bundles"
ON public.shared_bundle_access
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.organization_connections
    WHERE organization_connections.organization_id = shared_bundle_access.organization_id
      AND organization_connections.user_id = auth.uid()
      AND organization_connections.is_active = true
  )
);

-- Organization admins can update their shared bundles
CREATE POLICY "Org admins can update shared bundles"
ON public.shared_bundle_access
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = shared_bundle_access.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
  )
);

-- Organization admins can delete their shared bundles
CREATE POLICY "Org admins can delete shared bundles"
ON public.shared_bundle_access
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = shared_bundle_access.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_bundle_access_bundle_id ON public.shared_bundle_access(bundle_id);
CREATE INDEX IF NOT EXISTS idx_shared_bundle_access_org_id ON public.shared_bundle_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_bundle_access_active ON public.shared_bundle_access(is_active);