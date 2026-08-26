-- 1. Products: barcode, max stock, expiry
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS max_stock INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 2. Product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  sku TEXT,
  barcode TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants_select" ON public.product_variants FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "variants_insert" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.current_company_is_active());
CREATE POLICY "variants_update" ON public.product_variants FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "variants_delete" ON public.product_variants FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active());
CREATE TRIGGER trg_product_variants_updated BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. supplier_products: cost + preferred
ALTER TABLE public.supplier_products
  ADD COLUMN IF NOT EXISTS cost NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS supplier_sku TEXT,
  ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Supplier price history
CREATE TABLE IF NOT EXISTS public.supplier_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cost NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_price_history TO authenticated;
GRANT ALL ON public.supplier_price_history TO service_role;
ALTER TABLE public.supplier_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sph_select" ON public.supplier_price_history FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "sph_insert" ON public.supplier_price_history FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.current_company_is_active());
CREATE POLICY "sph_update" ON public.supplier_price_history FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "sph_delete" ON public.supplier_price_history FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active());

-- 5. Reserved stock
ALTER TABLE public.product_stock
  ADD COLUMN IF NOT EXISTS reserved INTEGER NOT NULL DEFAULT 0;

-- 6. Movements: warehouse traceability + transfers
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14,2);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_sph_product ON public.supplier_price_history(product_id, effective_date DESC);