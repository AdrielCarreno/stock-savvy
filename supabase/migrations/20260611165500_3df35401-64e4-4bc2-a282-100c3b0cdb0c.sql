
-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company can view its suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can insert its suppliers" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can update its suppliers" ON public.suppliers FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active())
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Company can delete its suppliers" ON public.suppliers FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- IMPORTS
CREATE TABLE public.imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  origin_country TEXT,
  status TEXT NOT NULL DEFAULT 'planificada',
  fob_usd NUMERIC(14,2) DEFAULT 0,
  freight_usd NUMERIC(14,2) DEFAULT 0,
  insurance_usd NUMERIC(14,2) DEFAULT 0,
  exchange_rate NUMERIC(14,4) DEFAULT 0,
  estimated_arrival DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imports TO authenticated;
GRANT ALL ON public.imports TO service_role;
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company can view its imports" ON public.imports FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can insert its imports" ON public.imports FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can update its imports" ON public.imports FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active())
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Company can delete its imports" ON public.imports FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE TRIGGER update_imports_updated_at BEFORE UPDATE ON public.imports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SHIPMENTS
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  import_id UUID REFERENCES public.imports(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  transport_mode TEXT NOT NULL DEFAULT 'maritimo',
  container_number TEXT,
  bl_number TEXT,
  etd DATE,
  eta DATE,
  status TEXT NOT NULL DEFAULT 'en_transito',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company can view its shipments" ON public.shipments FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can insert its shipments" ON public.shipments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can update its shipments" ON public.shipments FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active())
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Company can delete its shipments" ON public.shipments FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CUSTOMS DECLARATIONS
CREATE TABLE public.customs_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  import_id UUID REFERENCES public.imports(id) ON DELETE CASCADE,
  declaration_number TEXT,
  declaration_date DATE,
  tariff_position TEXT,
  cif_value_usd NUMERIC(14,2) DEFAULT 0,
  duties_amount NUMERIC(14,2) DEFAULT 0,
  taxes_amount NUMERIC(14,2) DEFAULT 0,
  broker TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customs_declarations TO authenticated;
GRANT ALL ON public.customs_declarations TO service_role;
ALTER TABLE public.customs_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company can view its customs" ON public.customs_declarations FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can insert its customs" ON public.customs_declarations FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE POLICY "Company can update its customs" ON public.customs_declarations FOR UPDATE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active())
  WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Company can delete its customs" ON public.customs_declarations FOR DELETE TO authenticated
  USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND public.current_company_is_active());
CREATE TRIGGER update_customs_updated_at BEFORE UPDATE ON public.customs_declarations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
