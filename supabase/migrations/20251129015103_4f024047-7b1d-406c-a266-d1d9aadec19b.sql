-- Create event_rsvps table to track event RSVPs
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.organization_events(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view their own RSVPs
CREATE POLICY "Users can view own RSVPs"
ON public.event_rsvps
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own RSVPs
CREATE POLICY "Users can create own RSVPs"
ON public.event_rsvps
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVPs
CREATE POLICY "Users can update own RSVPs"
ON public.event_rsvps
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete own RSVPs"
ON public.event_rsvps
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Organization admins can view RSVPs for their events
CREATE POLICY "Org admins can view event RSVPs"
ON public.event_rsvps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_events
    JOIN public.organization_members ON organization_events.organization_id = organization_members.organization_id
    WHERE organization_events.id = event_rsvps.event_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_event_rsvps_updated_at
BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_org_events_start_time ON public.organization_events(start_time);
CREATE INDEX IF NOT EXISTS idx_org_programs_active ON public.organization_programs(is_active);