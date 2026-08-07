-- Create broadcast_reads table to track which broadcasts users have seen
CREATE TABLE IF NOT EXISTS public.broadcast_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broadcast_id uuid NOT NULL REFERENCES public.organization_broadcasts(id) ON DELETE CASCADE,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, broadcast_id)
);

-- Enable RLS on broadcast_reads
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own read records
CREATE POLICY "Users can view own broadcast reads"
ON public.broadcast_reads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can mark broadcasts as read
CREATE POLICY "Users can mark broadcasts as read"
ON public.broadcast_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update RLS policies on organization_broadcasts to allow connected community users to view
-- Note: The existing policy already covers this, but let's ensure it's explicit
CREATE POLICY "Connected community users can view non-expired broadcasts"
ON public.organization_broadcasts
FOR SELECT
TO authenticated
USING (
  (expires_at IS NULL OR expires_at > now())
  AND (
    EXISTS (
      SELECT 1 FROM public.organization_connections
      WHERE organization_connections.organization_id = organization_broadcasts.organization_id
        AND organization_connections.user_id = auth.uid()
        AND organization_connections.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organization_broadcasts.organization_id
        AND organization_members.user_id = auth.uid()
    )
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_broadcast_reads_user_id ON public.broadcast_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_reads_broadcast_id ON public.broadcast_reads(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_org_broadcasts_org_id ON public.organization_broadcasts(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_broadcasts_expires_at ON public.organization_broadcasts(expires_at);