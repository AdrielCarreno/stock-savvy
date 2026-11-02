DROP POLICY IF EXISTS "Users can insert product_stock for their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can update product_stock of their company" ON public.product_stock;
DROP POLICY IF EXISTS "Users can delete product_stock of their company" ON public.product_stock;
REVOKE INSERT, UPDATE, DELETE ON public.product_stock FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.transfer_stock(p_product_id uuid, p_from uuid, p_to uuid, p_quantity integer, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.current_company_id(); v_qty integer;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL OR NOT public.can_operate() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'P0001'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_from = p_to THEN
    RAISE EXCEPTION 'Transferencia inválida' USING ERRCODE = 'P0001'; END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND company_id = v_company)
     OR (SELECT count(*) FROM warehouses WHERE id IN (p_from, p_to) AND company_id = v_company) <> 2 THEN
    RAISE EXCEPTION 'Producto o depósito inválido' USING ERRCODE = 'P0001'; END IF;
  SELECT quantity INTO v_qty FROM product_stock WHERE product_id = p_product_id AND warehouse_id = p_from FOR UPDATE;
  IF v_qty IS NULL OR v_qty < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente en el depósito de origen (%)', coalesce(v_qty,0) USING ERRCODE = 'P0001'; END IF;
  UPDATE product_stock SET quantity = quantity - p_quantity WHERE product_id = p_product_id AND warehouse_id = p_from;
  INSERT INTO product_stock (company_id, product_id, warehouse_id, quantity)
  VALUES (v_company, p_product_id, p_to, p_quantity)
  ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = product_stock.quantity + EXCLUDED.quantity;
  INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason, from_warehouse_id, to_warehouse_id, movement_date)
  VALUES (v_company, p_product_id, auth.uid(), 'salida', p_quantity, coalesce(p_reason,'Transferencia entre depósitos'), p_from, p_to, now());
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.place_initial_stock(p_product_id uuid, p_warehouse_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := public.current_company_id(); v_stock integer;
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL OR NOT public.can_operate() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'P0001'; END IF;
  SELECT current_stock INTO v_stock FROM products WHERE id = p_product_id AND company_id = v_company;
  IF v_stock IS NULL OR NOT EXISTS (SELECT 1 FROM warehouses WHERE id = p_warehouse_id AND company_id = v_company) THEN
    RAISE EXCEPTION 'Producto o depósito inválido' USING ERRCODE = 'P0001'; END IF;
  IF EXISTS (SELECT 1 FROM stock_movements WHERE product_id = p_product_id) THEN
    RAISE EXCEPTION 'El producto ya tiene movimientos' USING ERRCODE = 'P0001'; END IF;
  DELETE FROM product_stock WHERE product_id = p_product_id;
  INSERT INTO product_stock (company_id, product_id, warehouse_id, quantity) VALUES (v_company, p_product_id, p_warehouse_id, v_stock);
  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.transfer_stock(uuid,uuid,uuid,integer,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.place_initial_stock(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_stock(uuid,uuid,uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_initial_stock(uuid,uuid) TO authenticated;