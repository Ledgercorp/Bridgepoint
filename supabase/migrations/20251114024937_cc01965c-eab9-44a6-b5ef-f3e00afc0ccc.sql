-- Add moderation fields to study_rooms
ALTER TABLE public.study_rooms
ADD COLUMN moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN moderation_mode TEXT NOT NULL DEFAULT 'auto' CHECK (moderation_mode IN ('auto', 'manual'));

-- Set existing rooms to have creator as moderator with auto mode
UPDATE public.study_rooms
SET moderator_id = created_by,
    moderation_mode = 'auto'
WHERE moderator_id IS NULL;

-- Create pending participants table for manual moderation
CREATE TABLE public.pending_study_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Enable RLS on pending participants
ALTER TABLE public.pending_study_participants ENABLE ROW LEVEL SECURITY;

-- Policies for pending participants
CREATE POLICY "Users can view their own requests"
ON public.pending_study_participants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create join requests"
ON public.pending_study_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  status = 'pending' AND
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND current_mode = 'student')
);

CREATE POLICY "Moderators can view room requests"
ON public.pending_study_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND moderator_id = auth.uid()
  )
);

CREATE POLICY "Moderators can update requests"
ON public.pending_study_participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND moderator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND moderator_id = auth.uid()
  )
);

-- Update study rooms policies to include moderator permissions
CREATE POLICY "Moderators can update moderation settings"
ON public.study_rooms FOR UPDATE
USING (auth.uid() = moderator_id);

-- Create moderation log table
CREATE TABLE public.study_room_moderation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_content_id UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_room_moderation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view own actions"
ON public.study_room_moderation_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND moderator_id = auth.uid()
  )
);

CREATE POLICY "Moderators can log actions"
ON public.study_room_moderation_log FOR INSERT
WITH CHECK (
  auth.uid() = moderator_id AND
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND moderator_id = auth.uid()
  )
);

-- Enable realtime for pending participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_study_participants;