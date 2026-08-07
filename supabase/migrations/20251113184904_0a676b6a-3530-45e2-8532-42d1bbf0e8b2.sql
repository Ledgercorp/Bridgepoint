-- Add firstName and homeLocation fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS home_location text,
ADD COLUMN IF NOT EXISTS home_location_type text CHECK (home_location_type IN ('zip', 'city_state', 'coordinates'));

-- Add comment explaining the fields
COMMENT ON COLUMN public.user_profiles.first_name IS 'User first name for personalized greetings';
COMMENT ON COLUMN public.user_profiles.home_location IS 'Stored as ZIP code or city/state, never full address';
COMMENT ON COLUMN public.user_profiles.home_location_type IS 'Type of location stored: zip, city_state, or coordinates';