-- Create pinned_items table for quick access
CREATE TABLE public.pinned_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'navigation_step', 'document', 'life_task'
  item_id UUID NOT NULL,
  item_title TEXT NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.pinned_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pinned items"
ON public.pinned_items
FOR ALL
USING (auth.uid() = user_id);

-- Create collections table for organizing items
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own collections"
ON public.collections
FOR ALL
USING (auth.uid() = user_id);

-- Create collection_items table
CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, item_type, item_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items in their collections"
ON public.collection_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.collections
  WHERE collections.id = collection_items.collection_id
  AND collections.user_id = auth.uid()
));

-- Create item_notes table for annotations
CREATE TABLE public.item_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.item_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own item notes"
ON public.item_notes
FOR ALL
USING (auth.uid() = user_id);

-- Add trigger for updated_at on collections
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on item_notes
CREATE TRIGGER update_item_notes_updated_at
  BEFORE UPDATE ON public.item_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();