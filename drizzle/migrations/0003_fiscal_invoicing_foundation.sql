CREATE OR REPLACE FUNCTION public.can_manage_fiscal() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id = public.current_company_id() AND role IN ('admin','manager'));
$$;
CREATE OR REPLACE FUNCTION public.is_fiscal_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND company_id = public.current_company_id() AND role = 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_fiscal() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_fiscal_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_manage_fiscal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_fiscal_admin() TO authenticated;

CREATE TABLE public.fiscal_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  cuit text NOT NULL,
  legal_name text NOT NULL,
  iva_condition text NOT NULL,
  fiscal_address text,
  activity_start date,
  iibb text,
  sales_point integer NOT NULL DEFAULT 1,
  environment text NOT NULL DEFAULT 'homologacion',
  connection_status text NOT NULL DEFAULT 'not_connected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_settings_env CHECK (environment = 'homologacion'),
  CONSTRAINT fiscal_settings_iva CHECK (iva_condition IN ('responsable_inscripto','monotributo','exento')),
  CONSTRAINT fiscal_settings_cuit CHECK (cuit ~ '^[0-9]{11}$'),
  CONSTRAINT fiscal_settings_pv CHECK (sales_point BETWEEN 1 AND 99999),
  CONSTRAINT fiscal_settings_status CHECK (connection_status IN ('not_connected','connected','error'))
);
GRANT SELECT, INSERT, UPDATE ON public.fiscal_settings TO authenticated;
GRANT ALL ON public.fiscal_settings TO service_role;
ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fiscal_settings read own" ON public.fiscal_settings FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "fiscal_settings admin insert" ON public.fiscal_settings FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.is_fiscal_admin() AND connection_status = 'not_connected');
CREATE POLICY "fiscal_settings admin update" ON public.fiscal_settings FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.is_fiscal_admin()) WITH CHECK (company_id = public.current_company_id() AND public.is_fiscal_admin());
CREATE TRIGGER fiscal_settings_updated BEFORE UPDATE ON public.fiscal_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_fiscal_settings_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'authenticated' AND NEW.connection_status IS DISTINCT FROM OLD.connection_status THEN
    RAISE EXCEPTION 'El estado de conexión fiscal solo lo cambia el servicio fiscal.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fiscal_settings_protect BEFORE UPDATE ON public.fiscal_settings FOR EACH ROW EXECUTE FUNCTION public.protect_fiscal_settings_status();

CREATE TABLE public.fiscal_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  op_id uuid NOT NULL DEFAULT gen_random_uuid(),
  voucher_type text NOT NULL,
  sales_point integer NOT NULL,
  environment text NOT NULL DEFAULT 'homologacion',
  number integer,
  cae text,
  cae_due date,
  status text NOT NULL DEFAULT 'draft',
  receiver_name text,
  receiver_doc text,
  receiver_iva_condition text NOT NULL DEFAULT 'consumidor_final',
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  iva_amount numeric(14,2) NOT NULL DEFAULT 0,
  exempt_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_invoice_id uuid REFERENCES public.fiscal_invoices(id),
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_invoices_op UNIQUE (company_id, op_id),
  CONSTRAINT fiscal_invoices_type CHECK (voucher_type IN ('FA','FB','FC','NCA','NCB','NCC')),
  CONSTRAINT fiscal_invoices_status CHECK (status IN ('draft','pending','authorized','rejected','indeterminate','conflict')),
  CONSTRAINT fiscal_invoices_env CHECK (environment = 'homologacion'),
  CONSTRAINT fiscal_invoices_amounts CHECK (net_amount >= 0 AND iva_amount >= 0 AND exempt_amount >= 0 AND total = net_amount + iva_amount + exempt_amount)
);
CREATE INDEX fiscal_invoices_company_created ON public.fiscal_invoices (company_id, created_at DESC);
CREATE UNIQUE INDEX fiscal_invoices_number_unique ON public.fiscal_invoices (company_id, environment, sales_point, voucher_type, number) WHERE number IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiscal_invoices TO authenticated;
GRANT ALL ON public.fiscal_invoices TO service_role;
ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fiscal_invoices read own" ON public.fiscal_invoices FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "fiscal_invoices draft insert" ON public.fiscal_invoices FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.can_manage_fiscal() AND status = 'draft' AND number IS NULL AND cae IS NULL);
CREATE POLICY "fiscal_invoices draft update" ON public.fiscal_invoices FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.can_manage_fiscal() AND status = 'draft') WITH CHECK (company_id = public.current_company_id() AND status = 'draft' AND number IS NULL AND cae IS NULL);
CREATE POLICY "fiscal_invoices draft delete" ON public.fiscal_invoices FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.can_manage_fiscal() AND status = 'draft');
CREATE TRIGGER fiscal_invoices_updated BEFORE UPDATE ON public.fiscal_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_fiscal_invoice_links() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'authorized' THEN
    RAISE EXCEPTION 'Un comprobante autorizado no se puede modificar. Emití una nota de crédito.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.sale_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.sales WHERE id = NEW.sale_id AND company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'La venta no pertenece a esta empresa.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.customer_id AND company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'El cliente no pertenece a esta empresa.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.related_invoice_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.fiscal_invoices WHERE id = NEW.related_invoice_id AND company_id = NEW.company_id) THEN
    RAISE EXCEPTION 'El comprobante asociado no pertenece a esta empresa.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fiscal_invoices_validate BEFORE INSERT OR UPDATE ON public.fiscal_invoices FOR EACH ROW EXECUTE FUNCTION public.validate_fiscal_invoice_links();

CREATE OR REPLACE FUNCTION public.block_authorized_invoice_delete() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden borrar borradores.' USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER fiscal_invoices_no_delete BEFORE DELETE ON public.fiscal_invoices FOR EACH ROW EXECUTE FUNCTION public.block_authorized_invoice_delete();

CREATE TABLE public.fiscal_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.fiscal_invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL,
  unit_price numeric(14,2) NOT NULL,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  iva_rate numeric(5,2) NOT NULL,
  net_amount numeric(14,2) NOT NULL,
  iva_amount numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_items_values CHECK (quantity > 0 AND unit_price >= 0 AND discount >= 0 AND iva_rate IN (0, 2.5, 5, 10.5, 21, 27))
);
CREATE INDEX fiscal_invoice_items_invoice ON public.fiscal_invoice_items (invoice_id);
GRANT SELECT, INSERT, DELETE ON public.fiscal_invoice_items TO authenticated;
GRANT ALL ON public.fiscal_invoice_items TO service_role;
ALTER TABLE public.fiscal_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fiscal_items read own" ON public.fiscal_invoice_items FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "fiscal_items draft insert" ON public.fiscal_invoice_items FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.can_manage_fiscal() AND EXISTS (SELECT 1 FROM public.fiscal_invoices i WHERE i.id = invoice_id AND i.company_id = company_id AND i.status = 'draft'));
CREATE POLICY "fiscal_items draft delete" ON public.fiscal_invoice_items FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.can_manage_fiscal() AND EXISTS (SELECT 1 FROM public.fiscal_invoices i WHERE i.id = invoice_id AND i.status = 'draft'));

CREATE TABLE public.fiscal_invoice_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.fiscal_invoices(id) ON DELETE CASCADE,
  event text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fiscal_invoice_events TO authenticated;
GRANT ALL ON public.fiscal_invoice_events TO service_role;
ALTER TABLE public.fiscal_invoice_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fiscal_events read own" ON public.fiscal_invoice_events FOR SELECT TO authenticated USING (company_id = public.current_company_id());