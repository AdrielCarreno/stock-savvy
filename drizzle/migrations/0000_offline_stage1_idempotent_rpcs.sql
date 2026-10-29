ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_op_id uuid;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS client_op_id uuid;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS client_op_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS client_op_id uuid;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS client_op_id uuid;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS client_op_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS sales_client_op_uq ON public.sales(client_op_id) WHERE client_op_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_client_op_uq ON public.stock_movements(client_op_id) WHERE client_op_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_client_op_uq ON public.purchases(client_op_id) WHERE client_op_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_client_op_uq ON public.products(client_op_id) WHERE client_op_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_client_op_uq ON public.customers(client_op_id) WHERE client_op_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_client_op_uq ON public.suppliers(client_op_id) WHERE client_op_id IS NOT NULL;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.bump_row_version()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_products_version BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.bump_row_version();
CREATE TRIGGER trg_customers_version BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.bump_row_version();
CREATE TRIGGER trg_suppliers_version BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.bump_row_version();

CREATE INDEX IF NOT EXISTS products_company_updated_idx ON public.products(company_id, updated_at);
CREATE INDEX IF NOT EXISTS customers_company_updated_idx ON public.customers(company_id, updated_at);
CREATE INDEX IF NOT EXISTS suppliers_company_updated_idx ON public.suppliers(company_id, updated_at);
CREATE INDEX IF NOT EXISTS sales_company_updated_idx ON public.sales(company_id, updated_at);
CREATE INDEX IF NOT EXISTS stock_movements_company_created_idx ON public.stock_movements(company_id, created_at);
CREATE INDEX IF NOT EXISTS sale_items_company_created_idx ON public.sale_items(company_id, created_at);

CREATE OR REPLACE FUNCTION public.can_operate()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.current_company_is_active() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','manager','staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_op_id uuid, p_product_id uuid, p_type text, p_quantity integer,
  p_reason text DEFAULT NULL, p_sale_type text DEFAULT NULL, p_logistics text DEFAULT NULL,
  p_movement_date timestamptz DEFAULT now(), p_allow_negative boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cid uuid := public.current_company_id(); prod record; new_stock integer; existing record;
BEGIN
  IF auth.uid() IS NULL OR cid IS NULL OR NOT public.can_operate() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_op_id IS NOT NULL THEN
    SELECT id INTO existing FROM public.stock_movements WHERE client_op_id = p_op_id;
    IF FOUND THEN
      SELECT current_stock INTO new_stock FROM public.products WHERE id = p_product_id;
      RETURN jsonb_build_object('movement_id', existing.id, 'stock', new_stock, 'duplicate', true);
    END IF;
  END IF;
  IF p_type NOT IN ('entrada','salida') THEN RAISE EXCEPTION 'Tipo de movimiento inválido'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
  SELECT id, name, current_stock INTO prod FROM public.products
    WHERE id = p_product_id AND company_id = cid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
  new_stock := CASE WHEN p_type = 'entrada' THEN prod.current_stock + p_quantity ELSE prod.current_stock - p_quantity END;
  IF new_stock < 0 AND NOT (p_allow_negative AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))) THEN
    RAISE EXCEPTION 'Stock insuficiente de % (disponible %)', prod.name, prod.current_stock USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.stock_movements (company_id, product_id, user_id, type, quantity, reason, sale_type, logistics, movement_date, client_op_id)
  VALUES (cid, p_product_id, auth.uid(), p_type, p_quantity, p_reason, p_sale_type, p_logistics, COALESCE(p_movement_date, now()), p_op_id)
  RETURNING id INTO existing;
  UPDATE public.products SET current_stock = new_stock WHERE id = p_product_id;
  RETURN jsonb_build_object('movement_id', existing.id, 'stock', new_stock, 'duplicate', false);
END $$;

CREATE OR REPLACE FUNCTION public.create_pos_sale(p_op_id uuid, p_sale jsonb, p_lines jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cid uuid := public.current_company_id(); s public.sales; ln jsonb; prod record; qty integer; pid uuid;
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
  IF (p_sale->>'customer_id') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = (p_sale->>'customer_id')::uuid AND company_id = cid) THEN
    RAISE EXCEPTION 'Cliente inválido';
  END IF;

  -- Bloquear productos en orden para evitar interbloqueos y validar stock agregado
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

  INSERT INTO public.sales (company_id, customer_id, reference, channel, status, sale_date, discount, total,
    payment_method, payments, amount_received, change_amount, tax, source, created_by, client_op_id)
  VALUES (cid, NULLIF(p_sale->>'customer_id','')::uuid, p_sale->>'reference', 'pos', 'completada',
    COALESCE((p_sale->>'sale_date')::date, current_date),
    COALESCE((p_sale->>'discount')::numeric, 0), (p_sale->>'total')::numeric,
    p_sale->>'payment_method', COALESCE(p_sale->'payments', '[]'::jsonb),
    NULLIF(p_sale->>'amount_received','')::numeric, NULLIF(p_sale->>'change_amount','')::numeric,
    COALESCE((p_sale->>'tax')::numeric, 0), 'pos', auth.uid(), p_op_id)
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

  RETURN to_jsonb(s) || jsonb_build_object('duplicate', false);
END $$;

CREATE OR REPLACE FUNCTION public.annul_sale(p_sale_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cid uuid := public.current_company_id(); s record; it record;
BEGIN
  IF auth.uid() IS NULL OR cid IS NULL OR NOT public.can_operate() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
  END IF;
  SELECT id, status INTO s FROM public.sales WHERE id = p_sale_id AND company_id = cid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venta no encontrada'; END IF;
  IF s.status = 'anulada' THEN RETURN jsonb_build_object('id', s.id, 'duplicate', true); END IF;
  FOR it IN SELECT product_id, quantity FROM public.sale_items
            WHERE sale_id = p_sale_id AND product_id IS NOT NULL ORDER BY product_id LOOP
    UPDATE public.products SET current_stock = current_stock + it.quantity::integer
      WHERE id = it.product_id AND company_id = cid;
    INSERT INTO public.stock_movements (company_id, product_id, user_id, type, quantity, reason, movement_date)
    VALUES (cid, it.product_id, auth.uid(), 'entrada', it.quantity::integer, 'Anulación de venta POS', now());
  END LOOP;
  UPDATE public.sales SET status = 'anulada' WHERE id = p_sale_id;
  RETURN jsonb_build_object('id', s.id, 'duplicate', false);
END $$;

REVOKE ALL ON FUNCTION public.can_operate() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_stock_movement(uuid, uuid, text, integer, text, text, text, timestamptz, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_pos_sale(uuid, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.annul_sale(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_operate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stock_movement(uuid, uuid, text, integer, text, text, text, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pos_sale(uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.annul_sale(uuid) TO authenticated;