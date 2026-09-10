ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amount_received numeric,
  ADD COLUMN IF NOT EXISTS change_amount numeric,
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS sales_company_created_idx ON public.sales (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON public.sale_items (sale_id);