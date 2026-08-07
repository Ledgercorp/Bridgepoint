-- Allow the super admin email to manage their own admin role
CREATE POLICY "Super admin can manage own admin role"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'cweiss2@dtcc.edu'
)
WITH CHECK (
  user_id = auth.uid()
  AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'cweiss2@dtcc.edu'
);