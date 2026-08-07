-- Add edu_email field to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS edu_email text;

-- Create email verifications table for .edu verification tokens
CREATE TABLE IF NOT EXISTS public.edu_email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edu_email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on edu_email_verifications
ALTER TABLE public.edu_email_verifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own verification requests
CREATE POLICY "Users can insert own verification"
ON public.edu_email_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own verifications
CREATE POLICY "Users can view own verifications"
ON public.edu_email_verifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow public verification (needed for email link clicks)
CREATE POLICY "Anyone can verify tokens"
ON public.edu_email_verifications
FOR UPDATE
TO anon, authenticated
USING (verified = false AND expires_at > now());

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_edu_verifications_token ON public.edu_email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_edu_verifications_user_id ON public.edu_email_verifications(user_id);