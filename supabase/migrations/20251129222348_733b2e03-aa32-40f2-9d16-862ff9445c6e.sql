-- Step 1: Add connection_code column to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS connection_code text UNIQUE;

-- Generate codes for existing organizations that don't have one
UPDATE public.organizations
SET connection_code = 'BRIDGE-' || upper(substring(md5(random()::text || id::text) from 1 for 6))
WHERE connection_code IS NULL;

-- Step 2: Update the generate_org_connection_code function to use persistent codes
CREATE OR REPLACE FUNCTION public.generate_org_connection_code(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check for existing code
  SELECT connection_code INTO existing_code
  FROM public.organizations WHERE id = org_id;

  -- If code exists, return it
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;

  -- Generate and save new code
  new_code := 'BRIDGE-' || upper(substring(md5(random()::text || org_id::text) from 1 for 6));

  UPDATE public.organizations
  SET connection_code = new_code
  WHERE id = org_id;

  RETURN new_code;
END;
$$;

-- Step 3: Add RLS policy to allow public lookup by connection code
CREATE POLICY "Anyone can lookup organization by connection code"
ON public.organizations
FOR SELECT
USING (connection_code IS NOT NULL);