GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_company_is_active() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated, anon;