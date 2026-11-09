CREATE OR REPLACE FUNCTION public.derive_sale_total()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE sub numeric;
BEGIN
  NEW.discount := GREATEST(COALESCE(NEW.discount, 0), 0);
  NEW.tax := GREATEST(COALESCE(NEW.tax, 0), 0);
  IF TG_OP = 'INSERT' AND current_setting('app.pos_sale_total', true) = 'server' THEN
    RETURN NEW; -- total already computed server-side by create_pos_sale
  END IF;
  SELECT COALESCE(SUM(subtotal), 0) INTO sub FROM public.sale_items WHERE sale_id = NEW.id;
  NEW.total := round(GREATEST(sub - NEW.discount, 0) + NEW.tax, 2);
  RETURN NEW;
END $function$;

CREATE TRIGGER trg_a_sales_derive_total BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.derive_sale_total();

CREATE OR REPLACE FUNCTION public.touch_sale_total()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('app.pos_sale_total', true) = 'server' THEN RETURN NULL; END IF;
  UPDATE public.sales SET updated_at = now() WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  RETURN NULL;
END $function$;
REVOKE EXECUTE ON FUNCTION public.touch_sale_total() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sale_items_touch_total AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_sale_total();

CREATE OR REPLACE FUNCTION public.create_pos_sale(p_op_id uuid, p_sale jsonb, p_lines jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE cid uuid := public.current_company_id(); s public.sales; ln jsonb; prod record; qty integer; pid uuid;
  v_sub numeric := 0; v_disc numeric; v_tax numeric; v_total numeric; v_client_total numeric;
BEGIN
  IF auth.uid() IS NULL OR cid IS NULL OR NOT public.can_operate() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_op_id IS NOT NULL THEN
    SELECT * INTO s FROM public.sales WHERE client_op_id = p_op_id AND company_id = cid;
    IF FOUND THEN RETURN to_jsonb(s) || jsonb_build_object('duplicate', true); END IF;
  END IF;
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;
  IF p_sale->'payments' IS NULL OR jsonb_typeof(p_sale->'payments') <> 'array' OR jsonb_array_length(p_sale->'payments') = 0 THEN
    RAISE EXCEPTION 'Indicá al menos un medio de pago' USING ERRCODE = 'P0001';
  END IF;
  IF (p_sale->>'customer_id') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = (p_sale->>'customer_id')::uuid AND company_id = cid) THEN
    RAISE EXCEPTION 'Cliente inválido';
  END IF;

  FOR prod IN
    SELECT p.id, p.name, p.current_stock, SUM((l->>'quantity')::numeric)::integer AS req
    FROM jsonb_array_elements(p_lines) l
    JOIN public.products p ON p.id = (l->>'product_id')::uuid AND p.company_id = cid
    GROUP BY p.id, p.name, p.current_stock ORDER BY p.id
  LOOP
    PERFORM 1 FROM public.products WHERE id = prod.id FOR UPDATE;
    SELECT current_stock INTO qty FROM public.products WHERE id = prod.id;
    IF qty - prod.req < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente de % (disponible %)', prod.name, qty USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM jsonb_array_elements(p_lines) l
      WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = (l->>'product_id')::uuid AND p.company_id = cid)) > 0 THEN
    RAISE EXCEPTION 'Producto inválido';
  END IF;

  -- Total derivado en el servidor a partir de las líneas
  SELECT COALESCE(SUM(round(((l->>'quantity')::numeric)::integer * (l->>'unit_price')::numeric, 2)), 0)
    INTO v_sub FROM jsonb_array_elements(p_lines) l;
  v_disc := LEAST(GREATEST(COALESCE((p_sale->>'discount')::numeric, 0), 0), v_sub);
  v_tax := GREATEST(COALESCE((p_sale->>'tax')::numeric, 0), 0);
  v_total := round(v_sub - v_disc + v_tax, 2);
  v_client_total := (p_sale->>'total')::numeric;
  IF v_client_total IS NOT NULL AND abs(v_client_total - v_total) > 0.5 THEN
    RAISE EXCEPTION 'El total no coincide con los productos del carrito' USING ERRCODE = 'P0001';
  END IF;

  PERFORM set_config('app.pos_sale_total', 'server', true);
  INSERT INTO public.sales (company_id, customer_id, reference, channel, status, sale_date, discount, total,
    payment_method, payments, amount_received, change_amount, tax, source, created_by, client_op_id)
  VALUES (cid, NULLIF(p_sale->>'customer_id','')::uuid, p_sale->>'reference', 'pos', 'completada',
    COALESCE((p_sale->>'sale_date')::date, current_date),
    v_disc, v_total,
    p_sale->>'payment_method', p_sale->'payments',
    NULLIF(p_sale->>'amount_received','')::numeric, NULLIF(p_sale->>'change_amount','')::numeric,
    v_tax, 'pos', auth.uid(), p_op_id)
  RETURNING * INTO s;

  FOR ln IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    pid := (ln->>'product_id')::uuid;
    qty := (ln->>'quantity')::numeric::integer;
    INSERT INTO public.sale_items (company_id, sale_id, product_id, description, quantity, unit_price, subtotal)
    VALUES (cid, s.id, pid, ln->>'description', qty, (ln->>'unit_price')::numeric, 0);
    INSERT INTO public.stock_movements (company_id, product_id, user_id, type, quantity, reason, sale_type, movement_date)
    VALUES (cid, pid, auth.uid(), 'salida', qty, 'Venta POS', COALESCE(ln->>'sale_type','minorista'), now());
    UPDATE public.products SET current_stock = current_stock - qty WHERE id = pid;
  END LOOP;
  PERFORM set_config('app.pos_sale_total', '', true);

  -- Verificación final contra los subtotales validados por trigger (precio de lista)
  UPDATE public.sales SET updated_at = now() WHERE id = s.id RETURNING * INTO s;

  RETURN to_jsonb(s) || jsonb_build_object('duplicate', false);
END $function$;