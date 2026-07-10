-- Revoke EXECUTE on SECURITY DEFINER helper functions from anon/public so only signed-in
-- users can call them. Trigger functions do not need EXECUTE grants on any role.
REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_company_is_active() FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_warehouse() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_product_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_stock_movement_sale_type() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_is_active() TO authenticated;