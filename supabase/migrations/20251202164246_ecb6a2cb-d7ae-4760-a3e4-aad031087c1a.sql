-- Drop the old policy that doesn't work
DROP POLICY IF EXISTS "Super admin can manage own admin role" ON public.user_roles;

-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND email = 'cweiss2@dtcc.edu'
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Super admin can manage own admin role"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND public.is_super_admin(auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  AND public.is_super_admin(auth.uid())
);