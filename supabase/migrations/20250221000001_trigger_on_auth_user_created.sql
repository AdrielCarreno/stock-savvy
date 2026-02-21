-- ============================================
-- Trigger: on signup create company + admin user
-- ============================================
-- Expects metadata: { "company_name": "Nombre Empresa" } in signUp options

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  INSERT INTO public.companies (
    id,
    name,
    plan_type,
    trial_start,
    trial_end,
    subscription_status,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    COALESCE(TRIM(NEW.raw_user_meta_data->>'company_name'), 'Mi Empresa'),
    'basic',
    now(),
    now() + interval '14 days',
    'trial',
    now()
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.users (id, company_id, email, role, created_at)
  VALUES (NEW.id, new_company_id, NEW.email, 'admin', now());

  RETURN NEW;
END;
$$;

-- Trigger on auth.users (run this in Supabase SQL Editor if migrations don't have auth schema access)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
