-- Create user profiles table with mode tracking
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text,
  is_edu_verified boolean NOT NULL DEFAULT false,
  current_mode text NOT NULL DEFAULT 'community' CHECK (current_mode IN ('community', 'student')),
  has_completed_onboarding boolean NOT NULL DEFAULT false,
  preferences jsonb DEFAULT '{"theme": "light", "fontSize": "medium", "zipCode": null}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create learning notes table (student mode only)
CREATE TABLE public.learning_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  note_content text NOT NULL,
  educational_tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON public.learning_notes FOR ALL
  USING (auth.uid() = user_id);

-- Create resource kits table (student mode)
CREATE TABLE public.resource_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.resource_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own kits"
  ON public.resource_kits FOR ALL
  USING (auth.uid() = user_id);

-- Create resource kit items junction table
CREATE TABLE public.resource_kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid REFERENCES public.resource_kits(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(kit_id, resource_id)
);

ALTER TABLE public.resource_kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own kit items"
  ON public.resource_kit_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resource_kits
      WHERE resource_kits.id = resource_kit_items.kit_id
      AND resource_kits.user_id = auth.uid()
    )
  );

-- Add update trigger for profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_notes_updated_at
  BEFORE UPDATE ON public.learning_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_kits_updated_at
  BEFORE UPDATE ON public.resource_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, is_edu_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email LIKE '%.edu'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();