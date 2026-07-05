
-- 1) Backfill: every user whose users.role='admin' gets an admin user_roles entry.
INSERT INTO public.user_roles (company_id, user_id, role)
SELECT u.company_id, u.id, 'admin'::app_role
FROM public.users u
WHERE u.role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Ensure new signups (auto-admins) also get a user_roles admin row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  company_name TEXT;
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');

  INSERT INTO public.companies (name)
  VALUES (company_name)
  RETURNING id INTO new_company_id;

  INSERT INTO public.users (id, company_id, email, role)
  VALUES (NEW.id, new_company_id, NEW.email, 'admin');

  INSERT INTO public.user_roles (company_id, user_id, role)
  VALUES (new_company_id, NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3) Helper: is the current user the primary admin (users.role='admin') for their company?
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4) Replace the user_roles admin-manage policy so the primary admin can manage too.
DROP POLICY IF EXISTS "user_roles admin manage" ON public.user_roles;
CREATE POLICY "user_roles admin manage"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    company_id = current_company_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_company_admin())
  )
  WITH CHECK (
    company_id = current_company_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_company_admin())
  );

-- 5) Allow users to see other users in the same company (needed to look up by email
--    when assigning roles and to display emails on the roles table).
DROP POLICY IF EXISTS "Users can view company members" ON public.users;
CREATE POLICY "Users can view company members"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());
