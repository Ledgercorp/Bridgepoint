-- Add solace_personality preference to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS solace_personality TEXT DEFAULT 'empathetic';

-- Add check constraint for valid personalities
ALTER TABLE public.user_profiles
ADD CONSTRAINT valid_solace_personality
CHECK (solace_personality IN ('empathetic', 'practical', 'academic', 'cheerful'));