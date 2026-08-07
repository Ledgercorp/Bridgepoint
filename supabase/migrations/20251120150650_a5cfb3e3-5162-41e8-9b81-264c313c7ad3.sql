-- Add professional mode to user profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_professional_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS professional_email text,
ADD COLUMN IF NOT EXISTS professional_role text;

-- Update current_mode to support professional
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_current_mode_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_current_mode_check
CHECK (current_mode IN ('community', 'student', 'professional'));

-- Create professional email verifications table
CREATE TABLE IF NOT EXISTS public.professional_email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_email text NOT NULL,
  professional_role text,
  token text UNIQUE NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  verified_by_admin boolean DEFAULT false
);

ALTER TABLE public.professional_email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own verification"
ON public.professional_email_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verifications"
ON public.professional_email_verifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify tokens"
ON public.professional_email_verifications
FOR UPDATE
USING (verified = false AND expires_at > now());

-- Create resource bundles table
CREATE TABLE IF NOT EXISTS public.resource_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  notes text,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.resource_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage own bundles"
ON public.resource_bundles
FOR ALL
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND current_mode = 'professional'
    AND is_professional_verified = true
  )
);

-- Create trigger for resource bundles updated_at
CREATE TRIGGER update_resource_bundles_updated_at
BEFORE UPDATE ON public.resource_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();