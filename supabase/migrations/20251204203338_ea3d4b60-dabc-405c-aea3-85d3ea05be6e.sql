-- Drop and recreate the function to support optional regeneration
CREATE OR REPLACE FUNCTION public.regenerate_org_connection_code(org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate new code (always regenerate)
  new_code := 'BRIDGE-' || upper(substring(md5(random()::text || clock_timestamp()::text || org_id::text) from 1 for 6));

  UPDATE public.organizations
  SET connection_code = new_code
  WHERE id = org_id;

  RETURN new_code;
END;
$function$;