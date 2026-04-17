-- 1. Tabla warehouses
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouses_company ON public.warehouses(company_id);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view warehouses of their company"
ON public.warehouses FOR SELECT
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert warehouses for their company"
ON public.warehouses FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update warehouses of their company"
ON public.warehouses FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete warehouses of their company"
ON public.warehouses FOR DELETE
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tabla product_stock (stock por producto y depósito)
CREATE TABLE public.product_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_product_stock_company ON public.product_stock(company_id);
CREATE INDEX idx_product_stock_product ON public.product_stock(product_id);
CREATE INDEX idx_product_stock_warehouse ON public.product_stock(warehouse_id);

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product_stock of their company"
ON public.product_stock FOR SELECT
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert product_stock for their company"
ON public.product_stock FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update product_stock of their company"
ON public.product_stock FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete product_stock of their company"
ON public.product_stock FOR DELETE
USING (company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE TRIGGER update_product_stock_updated_at
BEFORE UPDATE ON public.product_stock
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Crear depósito "Principal" para cada empresa existente
INSERT INTO public.warehouses (company_id, name, is_default)
SELECT id, 'Principal', true FROM public.companies;

-- 4. Migrar stock actual de products al depósito principal
INSERT INTO public.product_stock (company_id, product_id, warehouse_id, quantity)
SELECT p.company_id, p.id, w.id, p.current_stock
FROM public.products p
JOIN public.warehouses w ON w.company_id = p.company_id AND w.is_default = true;

-- 5. Trigger: cada nueva empresa obtiene un depósito "Principal"
CREATE OR REPLACE FUNCTION public.create_default_warehouse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.warehouses (company_id, name, is_default)
  VALUES (NEW.id, 'Principal', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created_create_warehouse
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.create_default_warehouse();

-- 6. Trigger: cuando se cree un producto, crear su stock en el depósito principal
CREATE OR REPLACE FUNCTION public.create_default_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_wh_id UUID;
BEGIN
  SELECT id INTO default_wh_id
  FROM public.warehouses
  WHERE company_id = NEW.company_id AND is_default = true
  LIMIT 1;

  IF default_wh_id IS NOT NULL THEN
    INSERT INTO public.product_stock (company_id, product_id, warehouse_id, quantity)
    VALUES (NEW.company_id, NEW.id, default_wh_id, COALESCE(NEW.current_stock, 0))
    ON CONFLICT (product_id, warehouse_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_created_create_stock
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.create_default_product_stock();