DROP POLICY IF EXISTS variants_select ON public.product_variants;
CREATE POLICY variants_select ON public.product_variants FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.current_company_is_active());

CREATE OR REPLACE FUNCTION public.validate_sale_item()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p record;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
  IF NEW.unit_price IS NULL OR NEW.unit_price < 0 THEN RAISE EXCEPTION 'Precio inválido'; END IF;
  IF NEW.product_id IS NOT NULL
     AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    SELECT price, price_retail, price_wholesale INTO p FROM public.products
      WHERE id = NEW.product_id AND company_id = NEW.company_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto inválido'; END IF;
    IF NOT (NEW.unit_price IN (coalesce(p.price,-1), coalesce(p.price_retail,-1), coalesce(p.price_wholesale,-1))
            OR (p.price IS NULL AND p.price_retail IS NULL AND p.price_wholesale IS NULL)) THEN
      RAISE EXCEPTION 'Solo administradores o gerentes pueden modificar el precio de lista';
    END IF;
  END IF;
  NEW.subtotal := round(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_sale_item ON public.sale_items;
CREATE TRIGGER trg_validate_sale_item BEFORE INSERT OR UPDATE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.validate_sale_item();

CREATE OR REPLACE FUNCTION public.validate_sale_payments()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE el jsonb; s numeric := 0; cash numeric := 0; amt numeric;
BEGIN
  IF NEW.payments IS NULL OR jsonb_typeof(NEW.payments) <> 'array' OR jsonb_array_length(NEW.payments) = 0 THEN
    NEW.amount_received := NULL; NEW.change_amount := NULL; RETURN NEW;
  END IF;
  FOR el IN SELECT * FROM jsonb_array_elements(NEW.payments) LOOP
    IF (el->>'method') NOT IN ('efectivo','debito','credito','transferencia','mercadopago','otro') THEN
      RAISE EXCEPTION 'Medio de pago inválido';
    END IF;
    amt := (el->>'amount')::numeric;
    IF amt IS NULL OR amt < 0 THEN RAISE EXCEPTION 'Monto de pago inválido'; END IF;
    s := s + amt;
    IF el->>'method' = 'efectivo' THEN cash := cash + amt; END IF;
  END LOOP;
  IF abs(s - NEW.total) > 0.5 THEN RAISE EXCEPTION 'El total pagado no coincide con el total de la venta'; END IF;
  IF cash > 0 THEN
    IF NEW.amount_received IS NULL OR NEW.amount_received < cash THEN
      NEW.amount_received := cash;
    END IF;
    NEW.change_amount := round(NEW.amount_received - cash, 2);
  ELSE
    NEW.amount_received := NULL; NEW.change_amount := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_sale_payments ON public.sales;
CREATE TRIGGER trg_validate_sale_payments BEFORE INSERT OR UPDATE OF payments, total, amount_received, change_amount ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.validate_sale_payments();