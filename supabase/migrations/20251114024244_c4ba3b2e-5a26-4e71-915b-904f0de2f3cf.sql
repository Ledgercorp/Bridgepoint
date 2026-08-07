-- Update the handle_new_user function to automatically set student mode for .edu emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_edu_email boolean;
BEGIN
  -- Check if email ends with .edu
  is_edu_email := NEW.email LIKE '%.edu';

  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    display_name,
    current_mode,
    edu_email,
    is_edu_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'first_name',
    CASE WHEN is_edu_email THEN 'student' ELSE 'community' END,
    CASE WHEN is_edu_email THEN NEW.email ELSE NULL END,
    is_edu_email
  );

  RETURN NEW;
END;
$function$;