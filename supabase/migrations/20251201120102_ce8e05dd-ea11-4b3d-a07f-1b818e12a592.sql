-- Fix Function Search Path Mutable
-- Add search_path to cleanup_old_activity function
CREATE OR REPLACE FUNCTION public.cleanup_old_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.recent_activity
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.recent_activity
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$function$;