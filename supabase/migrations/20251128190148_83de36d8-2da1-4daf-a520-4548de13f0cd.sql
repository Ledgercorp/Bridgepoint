-- Allow instructor as a valid current_mode value
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_current_mode_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_current_mode_check
  CHECK (current_mode IN ('community', 'student', 'professional', 'instructor'));
