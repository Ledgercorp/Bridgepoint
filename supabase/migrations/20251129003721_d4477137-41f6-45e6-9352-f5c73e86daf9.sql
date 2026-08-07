-- Community Navigation Bridge Tables

-- Table for community user connections to organizations
CREATE TABLE public.organization_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_code TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(organization_id, user_id)
);

-- Table for support threads (general purpose, non-identifying)
CREATE TABLE public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  community_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  auto_delete_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Table for thread messages
CREATE TABLE public.thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('community', 'staff')),
  message_content TEXT NOT NULL,
  is_moderated BOOLEAN NOT NULL DEFAULT false,
  moderation_flags JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization Hub Tables

-- Table for organization events
CREATE TABLE public.organization_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for organization broadcasts
CREATE TABLE public.organization_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  broadcast_type TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Table for organization programs (public facing)
CREATE TABLE public.organization_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT,
  hours TEXT,
  contact_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.organization_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_connections

CREATE POLICY "Users can view their own connections"
ON public.organization_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
ON public.organization_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org admins can view their org connections"
ON public.organization_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organization_connections.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- RLS Policies for support_threads

CREATE POLICY "Community users can view their own threads"
ON public.support_threads
FOR SELECT
USING (auth.uid() = community_user_id);

CREATE POLICY "Community users can create threads"
ON public.support_threads
FOR INSERT
WITH CHECK (
  auth.uid() = community_user_id
  AND EXISTS (
    SELECT 1 FROM public.organization_connections
    WHERE organization_connections.organization_id = support_threads.organization_id
    AND organization_connections.user_id = auth.uid()
    AND organization_connections.is_active = true
  )
);

CREATE POLICY "Org staff can view their org threads"
ON public.support_threads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = support_threads.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Org staff can update their org threads"
ON public.support_threads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = support_threads.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- RLS Policies for thread_messages

CREATE POLICY "Thread participants can view messages"
ON public.thread_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_threads
    WHERE support_threads.id = thread_messages.thread_id
    AND (
      support_threads.community_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = support_threads.organization_id
        AND organization_members.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can send messages in their threads"
ON public.thread_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.support_threads
    WHERE support_threads.id = thread_messages.thread_id
    AND (
      (support_threads.community_user_id = auth.uid() AND sender_type = 'community')
      OR (
        EXISTS (
          SELECT 1 FROM public.organization_members
          WHERE organization_members.organization_id = support_threads.organization_id
          AND organization_members.user_id = auth.uid()
        ) AND sender_type = 'staff'
      )
    )
  )
);

-- RLS Policies for organization_events

CREATE POLICY "Public events are viewable by everyone"
ON public.organization_events
FOR SELECT
USING (is_public = true);

CREATE POLICY "Org staff can manage their events"
ON public.organization_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organization_events.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- RLS Policies for organization_broadcasts

CREATE POLICY "Connected users can view broadcasts"
ON public.organization_broadcasts
FOR SELECT
USING (
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
);

CREATE POLICY "Org admins can create broadcasts"
ON public.organization_broadcasts
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organization_broadcasts.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- RLS Policies for organization_programs

CREATE POLICY "Public programs are viewable by everyone"
ON public.organization_programs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Org admins can manage their programs"
ON public.organization_programs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organization_programs.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

-- Indexes for performance
CREATE INDEX idx_org_connections_org_id ON public.organization_connections(organization_id);
CREATE INDEX idx_org_connections_user_id ON public.organization_connections(user_id);
CREATE INDEX idx_support_threads_org_id ON public.support_threads(organization_id);
CREATE INDEX idx_support_threads_user_id ON public.support_threads(community_user_id);
CREATE INDEX idx_support_threads_status ON public.support_threads(status);
CREATE INDEX idx_thread_messages_thread_id ON public.thread_messages(thread_id);
CREATE INDEX idx_org_events_org_id ON public.organization_events(organization_id);
CREATE INDEX idx_org_broadcasts_org_id ON public.organization_broadcasts(organization_id);
CREATE INDEX idx_org_programs_org_id ON public.organization_programs(organization_id);

-- Triggers for updated_at
CREATE TRIGGER update_support_threads_updated_at
BEFORE UPDATE ON public.support_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_events_updated_at
BEFORE UPDATE ON public.organization_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_programs_updated_at
BEFORE UPDATE ON public.organization_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique connection codes
CREATE OR REPLACE FUNCTION public.generate_org_connection_code(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  org_name TEXT;
BEGIN
  SELECT name INTO org_name FROM public.organizations WHERE id = org_id;

  -- Generate a short, memorable code (e.g., BRIDGE-ABC123)
  code := 'BRIDGE-' || upper(substring(md5(random()::text) from 1 for 6));

  RETURN code;
END;
$$;

-- Enable realtime for support threads and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_broadcasts;