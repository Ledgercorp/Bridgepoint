-- Add instructor mode support and instructor access codes

-- Update current_mode enum to include instructor
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'instructor';

-- Create instructor_access_codes table
CREATE TABLE IF NOT EXISTS public.instructor_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT
);

-- Enable RLS on instructor_access_codes
ALTER TABLE public.instructor_access_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage instructor codes
CREATE POLICY "Admins can manage instructor codes"
ON public.instructor_access_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can validate instructor codes (for verification)
CREATE POLICY "Anyone can validate instructor codes"
ON public.instructor_access_codes
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create table to track who has used instructor codes
CREATE TABLE IF NOT EXISTS public.instructor_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.instructor_access_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Enable RLS on instructor_code_usage
ALTER TABLE public.instructor_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own code usage"
ON public.instructor_code_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can record code usage"
ON public.instructor_code_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all usage
CREATE POLICY "Admins can view all code usage"
ON public.instructor_code_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add instructor_verified flag to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_instructor_verified BOOLEAN NOT NULL DEFAULT false;

-- Add function to validate and use instructor code
CREATE OR REPLACE FUNCTION public.validate_instructor_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
  v_result JSONB;
BEGIN
  -- Check if code exists and is valid
  SELECT * INTO v_code_record
  FROM public.instructor_access_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  -- If code not found or invalid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Invalid or expired instructor access code'
    );
  END IF;

  -- Check if user already used this code
  IF EXISTS (
    SELECT 1 FROM public.instructor_code_usage
    WHERE code_id = v_code_record.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'You have already used this code'
    );
  END IF;

  -- Record usage
  INSERT INTO public.instructor_code_usage (code_id, user_id)
  VALUES (v_code_record.id, p_user_id);

  -- Increment usage count
  UPDATE public.instructor_access_codes
  SET current_uses = current_uses + 1
  WHERE id = v_code_record.id;

  -- Mark user as instructor verified
  UPDATE public.user_profiles
  SET is_instructor_verified = true,
      current_mode = 'instructor'
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Instructor mode activated successfully'
  );
END;
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.validate_instructor_code(TEXT, UUID) TO authenticated;