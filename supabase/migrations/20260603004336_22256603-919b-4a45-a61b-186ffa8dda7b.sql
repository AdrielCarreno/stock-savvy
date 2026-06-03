-- Helper: check if current user's company is active (paid) or within trial period
CREATE OR REPLACE FUNCTION public.current_company_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.companies c ON c.id = u.company_id
    WHERE u.id = auth.uid()
      AND (
        c.subscription_status = 'active'
        OR (c.subscription_status = 'trial' AND c.trial_end > now())
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.current_company_is_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_company_is_active() TO authenticated, service_role;

-- =========================
-- products
-- =========================
DROP POLICY IF EXISTS "Users can view products of their company" ON public.products;
DROP POLICY IF EXISTS "Users can insert products for their company" ON public.products;
DROP POLICY IF EXISTS "Users can update products of their company" ON public.products;
DROP POLICY IF EXISTS "Users can delete products of their company" ON public.products;

CREATE POLICY "Users can view products of their company"
ON public.products FOR SELECT
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can insert products for their company"
ON public.products FOR INSERT
WITH CHECK (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can update products of their company"
ON public.products FOR UPDATE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can delete products of their company"
ON public.products FOR DELETE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

-- =========================
-- stock_movements
-- =========================
DROP POLICY IF EXISTS "Users can view movements of their company" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert movements for their company" ON public.stock_movements;

CREATE POLICY "Users can view movements of their company"
ON public.stock_movements FOR SELECT
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can insert movements for their company"
ON public.stock_movements FOR INSERT
WITH CHECK (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND user_id = auth.uid()
  AND public.current_company_is_active()
);

-- =========================
-- warehouses
-- =========================
DROP POLICY IF EXISTS "Users can view warehouses of their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can insert warehouses for their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can update warehouses of their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can delete warehouses of their company" ON public.warehouses;

CREATE POLICY "Users can view warehouses of their company"
ON public.warehouses FOR SELECT
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can insert warehouses for their company"
ON public.warehouses FOR INSERT
WITH CHECK (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can update warehouses of their company"
ON public.warehouses FOR UPDATE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can delete warehouses of their company"
ON public.warehouses FOR DELETE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

-- =========================
-- product_stock
-- =========================
DROP POLICY IF EXISTS "Users can view product_stock of their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can insert product_stock for their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can update product_stock of their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can delete product_stock of their company" ON public.product_stock;

CREATE POLICY "Users can view product_stock of their company"
ON public.product_stock FOR SELECT
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can insert product_stock for their company"
ON public.product_stock FOR INSERT
WITH CHECK (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can update product_stock of their company"
ON public.product_stock FOR UPDATE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);

CREATE POLICY "Users can delete product_stock of their company"
ON public.product_stock FOR DELETE
USING (
  company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  AND public.current_company_is_active()
);
