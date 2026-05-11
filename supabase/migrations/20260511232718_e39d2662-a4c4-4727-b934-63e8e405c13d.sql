-- 1. Tighten stock_movements INSERT policy to enforce user_id = auth.uid()
DROP POLICY IF EXISTS "Users can insert movements for their company" ON public.stock_movements;
CREATE POLICY "Users can insert movements for their company"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT users.company_id FROM public.users WHERE users.id = auth.uid())
    AND user_id = auth.uid()
  );

-- 2. Revoke EXECUTE on internal SECURITY DEFINER trigger functions from anon/authenticated.
-- These are only meant to be called by database triggers, not via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_default_warehouse() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_default_product_stock() FROM anon, authenticated, public;