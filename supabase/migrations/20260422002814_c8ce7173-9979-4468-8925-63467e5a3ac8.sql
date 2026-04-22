
-- Add sale type and movement date columns to stock_movements
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS sale_type TEXT,
  ADD COLUMN IF NOT EXISTS movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Validation trigger for sale_type values
CREATE OR REPLACE FUNCTION public.validate_stock_movement_sale_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sale_type IS NOT NULL AND NEW.sale_type NOT IN ('mayorista', 'minorista') THEN
    RAISE EXCEPTION 'sale_type must be either mayorista or minorista';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_stock_movement_sale_type_trigger ON public.stock_movements;
CREATE TRIGGER validate_stock_movement_sale_type_trigger
BEFORE INSERT OR UPDATE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.validate_stock_movement_sale_type();
