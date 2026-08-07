-- Create study rooms table
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  created_by UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study room participants table
CREATE TABLE public.study_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create shared study notes table
CREATE TABLE public.shared_study_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study room resources table (linking resources to rooms)
CREATE TABLE public.study_room_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_resources ENABLE ROW LEVEL SECURITY;

-- Study rooms policies
CREATE POLICY "Public rooms viewable by students"
ON public.study_rooms FOR SELECT
USING (
  is_private = false OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.study_room_participants
    WHERE room_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Students can create rooms"
ON public.study_rooms FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND current_mode = 'student')
);

CREATE POLICY "Room creators can update their rooms"
ON public.study_rooms FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Room creators can delete their rooms"
ON public.study_rooms FOR DELETE
USING (auth.uid() = created_by);

-- Participants policies
CREATE POLICY "Participants can view room members"
ON public.study_room_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = room_id AND (
      is_private = false OR
      created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM public.study_room_participants WHERE room_id = id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Students can join rooms"
ON public.study_room_participants FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND current_mode = 'student')
);

CREATE POLICY "Users can leave rooms"
ON public.study_room_participants FOR DELETE
USING (auth.uid() = user_id);

-- Shared notes policies
CREATE POLICY "Room participants can view notes"
ON public.shared_study_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_room_participants
    WHERE room_id = shared_study_notes.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Room participants can create notes"
ON public.shared_study_notes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.study_room_participants
    WHERE room_id = shared_study_notes.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Note authors can update their notes"
ON public.shared_study_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Note authors can delete their notes"
ON public.shared_study_notes FOR DELETE
USING (auth.uid() = user_id);

-- Study room resources policies
CREATE POLICY "Room participants can view resources"
ON public.study_room_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.study_room_participants
    WHERE room_id = study_room_resources.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Room participants can add resources"
ON public.study_room_resources FOR INSERT
WITH CHECK (
  auth.uid() = added_by AND
  EXISTS (
    SELECT 1 FROM public.study_room_participants
    WHERE room_id = study_room_resources.room_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Resource adders can remove their resources"
ON public.study_room_resources FOR DELETE
USING (auth.uid() = added_by);

-- Triggers for updated_at
CREATE TRIGGER update_study_rooms_updated_at
BEFORE UPDATE ON public.study_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_study_notes_updated_at
BEFORE UPDATE ON public.shared_study_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_study_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_resources;