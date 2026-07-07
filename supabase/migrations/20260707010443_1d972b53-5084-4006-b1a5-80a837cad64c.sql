ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS logistics text,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS invoice_number text;