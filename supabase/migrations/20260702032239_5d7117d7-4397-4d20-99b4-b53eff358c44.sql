ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_wholesale numeric,
  ADD COLUMN IF NOT EXISTS price_retail numeric;

-- Backfill retail price from existing "price" column so nothing is lost
UPDATE public.products SET price_retail = price WHERE price_retail IS NULL AND price IS NOT NULL;