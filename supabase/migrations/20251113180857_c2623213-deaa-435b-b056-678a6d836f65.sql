-- Create table for Document Safe Box
CREATE TABLE IF NOT EXISTS public.saved_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT, -- e.g., 'ID', 'Insurance', 'Housing', etc.
  file_url TEXT NOT NULL,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own documents"
  ON public.saved_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.saved_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.saved_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.saved_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_documents_updated_at
  BEFORE UPDATE ON public.saved_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for saved navigation steps
CREATE TABLE IF NOT EXISTS public.saved_navigation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT, -- e.g., 'Getting ID', 'Applying for Benefits', etc.
  steps JSONB NOT NULL, -- Array of step objects
  resources JSONB, -- Related resources
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_navigation_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own navigation steps"
  ON public.saved_navigation_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own navigation steps"
  ON public.saved_navigation_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own navigation steps"
  ON public.saved_navigation_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own navigation steps"
  ON public.saved_navigation_steps FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_navigation_steps_updated_at
  BEFORE UPDATE ON public.saved_navigation_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();