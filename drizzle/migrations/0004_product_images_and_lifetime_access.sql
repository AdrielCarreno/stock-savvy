ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id UUID;
  company_name TEXT;
  lifetime boolean := lower(NEW.email) IN ('backhome.contacto@gmail.com');
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');
  INSERT INTO public.companies (name, subscription_status, plan_type, trial_end)
  VALUES (company_name,
          CASE WHEN lifetime THEN 'active' ELSE 'trial' END,
          CASE WHEN lifetime THEN 'lifetime' ELSE 'trial' END,
          CASE WHEN lifetime THEN '2999-12-31'::timestamptz ELSE now() + interval '7 days' END)
  RETURNING id INTO new_company_id;
  INSERT INTO public.users (id, company_id, email, role) VALUES (NEW.id, new_company_id, NEW.email, 'admin');
  INSERT INTO public.user_roles (company_id, user_id, role) VALUES (new_company_id, NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE POLICY "product images read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = public.current_company_id()::text);
CREATE POLICY "product images insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_operate());
CREATE POLICY "product images delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_operate());