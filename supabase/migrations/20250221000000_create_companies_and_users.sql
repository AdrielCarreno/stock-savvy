-- ============================================
-- Multi-tenant auth: companies + users
-- ============================================

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end TIMESTAMPTZ NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table (app profile linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for RLS and lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON public.companies(subscription_status);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS: users can only read/update their own company
CREATE POLICY "Users can read own company"
  ON public.companies FOR SELECT
  USING (
    id IN (SELECT company_id FROM public.users WHERE users.id = auth.uid())
  );

CREATE POLICY "Users can update own company (e.g. name)"
  ON public.companies FOR UPDATE
  USING (
    id IN (SELECT company_id FROM public.users WHERE users.id = auth.uid())
  );

-- RLS: users can only read users of their company
CREATE POLICY "Users can read users in own company"
  ON public.users FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.users WHERE users.id = auth.uid())
  );

-- Policy for trigger: no direct insert from client into companies/users on signup;
-- the trigger runs as SECURITY DEFINER and bypasses RLS for the insert.

-- Allow service role / trigger to insert (trigger runs in backend with definer)
-- We use a trigger on auth.users to create company + user, so we don't need INSERT policies
-- for normal users. Only the trigger function will insert.

COMMENT ON TABLE public.companies IS 'Multi-tenant: one row per company';
COMMENT ON TABLE public.users IS 'App users linked to auth.users; one admin per company on signup';
