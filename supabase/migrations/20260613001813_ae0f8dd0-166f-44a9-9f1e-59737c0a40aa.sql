
-- companies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid()));
CREATE POLICY "Users can update their own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid()))
  WITH CHECK (
    (id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid()))
    AND (subscription_status = (SELECT c.subscription_status FROM companies c WHERE c.id = companies.id))
    AND (plan_type = (SELECT c.plan_type FROM companies c WHERE c.id = companies.id))
    AND (trial_start = (SELECT c.trial_start FROM companies c WHERE c.id = companies.id))
    AND (trial_end = (SELECT c.trial_end FROM companies c WHERE c.id = companies.id))
  );

-- users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT u.role FROM users u WHERE u.id = auth.uid())
    AND company_id = (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
  );

-- products
DROP POLICY IF EXISTS "Users can view products of their company" ON public.products;
DROP POLICY IF EXISTS "Users can insert products for their company" ON public.products;
DROP POLICY IF EXISTS "Users can update products of their company" ON public.products;
DROP POLICY IF EXISTS "Users can delete products of their company" ON public.products;
CREATE POLICY "Users can view products of their company" ON public.products FOR SELECT TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can insert products for their company" ON public.products FOR INSERT TO authenticated
  WITH CHECK ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can update products of their company" ON public.products FOR UPDATE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can delete products of their company" ON public.products FOR DELETE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());

-- product_stock
DROP POLICY IF EXISTS "Users can view product_stock of their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can insert product_stock for their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can update product_stock of their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can delete product_stock of their company" ON public.product_stock;
CREATE POLICY "Users can view product_stock of their company" ON public.product_stock FOR SELECT TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can insert product_stock for their company" ON public.product_stock FOR INSERT TO authenticated
  WITH CHECK ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can update product_stock of their company" ON public.product_stock FOR UPDATE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can delete product_stock of their company" ON public.product_stock FOR DELETE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());

-- warehouses
DROP POLICY IF EXISTS "Users can view warehouses of their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can insert warehouses for their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can update warehouses of their company" ON public.warehouses;
DROP POLICY IF EXISTS "Users can delete warehouses of their company" ON public.warehouses;
CREATE POLICY "Users can view warehouses of their company" ON public.warehouses FOR SELECT TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can insert warehouses for their company" ON public.warehouses FOR INSERT TO authenticated
  WITH CHECK ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can update warehouses of their company" ON public.warehouses FOR UPDATE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can delete warehouses of their company" ON public.warehouses FOR DELETE TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());

-- stock_movements
DROP POLICY IF EXISTS "Users can view movements of their company" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert movements for their company" ON public.stock_movements;
CREATE POLICY "Users can view movements of their company" ON public.stock_movements FOR SELECT TO authenticated
  USING ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND current_company_is_active());
CREATE POLICY "Users can insert movements for their company" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK ((company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())) AND (user_id = auth.uid()) AND current_company_is_active());

-- storage UPDATE policy for operation-docs
DROP POLICY IF EXISTS op_docs_storage_update ON storage.objects;
CREATE POLICY op_docs_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'operation-docs'
    AND (storage.foldername(name))[1] = (SELECT (users.company_id)::text FROM users WHERE users.id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'operation-docs'
    AND (storage.foldername(name))[1] = (SELECT (users.company_id)::text FROM users WHERE users.id = auth.uid())
  );
