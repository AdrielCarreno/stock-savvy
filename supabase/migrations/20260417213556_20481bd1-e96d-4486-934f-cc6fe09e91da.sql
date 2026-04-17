-- Fix PRIVILEGE_ESCALATION on users: prevent users from changing their role or company_id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
    AND company_id = (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
  );

-- Fix PUBLIC_DATA_EXPOSURE on companies: prevent users from changing billing/subscription fields
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

CREATE POLICY "Users can update their own company"
  ON public.companies
  FOR UPDATE
  USING (id IN (SELECT users.company_id FROM public.users WHERE users.id = auth.uid()))
  WITH CHECK (
    id IN (SELECT users.company_id FROM public.users WHERE users.id = auth.uid())
    AND subscription_status = (SELECT c.subscription_status FROM public.companies c WHERE c.id = companies.id)
    AND plan_type = (SELECT c.plan_type FROM public.companies c WHERE c.id = companies.id)
    AND trial_start = (SELECT c.trial_start FROM public.companies c WHERE c.id = companies.id)
    AND trial_end = (SELECT c.trial_end FROM public.companies c WHERE c.id = companies.id)
  );