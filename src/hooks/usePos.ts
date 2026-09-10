import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/errors";
import { toast } from "sonner";

export type CartLine = {
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  stock: number;
  discount: number; // monto fijo por línea
};

export type PaymentSplit = { method: string; amount: number };

export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Tarjeta de débito" },
  { value: "credito", label: "Tarjeta de crédito" },
  { value: "transferencia", label: "Transferencia" },
  { value: "qr", label: "QR / Billetera" },
];

export const payLabel = (v: string | null | undefined) =>
  PAYMENT_METHODS.find((p) => p.value === v)?.label ?? (v ?? "-");

export const fmtARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(n) || 0);

export type PosSaleInput = {
  lines: CartLine[];
  discount: number;
  tax: number;
  total: number;
  payments: PaymentSplit[];
  amount_received: number | null;
  change_amount: number | null;
  customer_id: string | null;
  reference?: string | null;
};

export function usePos() {
  const { profile, user, company } = useAuth();
  const companyId = profile?.company_id ?? company?.id ?? null;

  /** Ajusta stock de productos y deja el movimiento en el inventario existente. */
  const applyStock = useCallback(
    async (items: { product_id: string; quantity: number }[], type: "entrada" | "salida", reason: string) => {
      if (!companyId || !user?.id) return { error: new Error("No autenticado") };
      const ids = Array.from(new Set(items.map((i) => i.product_id)));
      const { data: prods, error } = await supabase
        .from("products")
        .select("id, name, current_stock")
        .in("id", ids);
      if (error || !prods) return { error: error ?? new Error("Productos no encontrados") };

      const stockMap = new Map(prods.map((p) => [p.id, { stock: p.current_stock, name: p.name }]));
      const next = new Map<string, number>();
      for (const it of items) {
        const p = stockMap.get(it.product_id);
        if (!p) return { error: new Error("Producto no encontrado") };
        const base = next.get(it.product_id) ?? p.stock;
        const val = type === "entrada" ? base + it.quantity : base - it.quantity;
        if (val < 0) {
          toast.error(`Stock insuficiente de ${p.name} (disponible ${p.stock})`);
          return { error: new Error("insufficient stock") };
        }
        next.set(it.product_id, val);
      }

      const { error: mErr } = await supabase.from("stock_movements").insert(
        items.map((it) => ({
          company_id: companyId,
          product_id: it.product_id,
          user_id: user.id,
          type,
          quantity: it.quantity,
          reason,
          sale_type: "minorista" as const,
          movement_date: new Date().toISOString(),
        }))
      );
      if (mErr) return { error: mErr };

      for (const [id, qty] of next) {
        const { error: uErr } = await supabase.from("products").update({ current_stock: qty }).eq("id", id);
        if (uErr) return { error: uErr };
      }
      return { error: null };
    },
    [companyId, user?.id]
  );

  const createSale = useCallback(
    async (input: PosSaleInput) => {
      if (!companyId || !user?.id) {
        toast.error("No autenticado");
        return { error: new Error("No autenticado"), sale: null };
      }
      if (input.lines.length === 0) {
        toast.error("El carrito está vacío");
        return { error: new Error("empty"), sale: null };
      }

      const stockRes = await applyStock(
        input.lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        "salida",
        "Venta POS"
      );
      if (stockRes.error) {
        if ((stockRes.error as Error).message !== "insufficient stock") {
          toast.error(friendlyError(stockRes.error, "Error al descontar stock"));
        }
        return { error: stockRes.error, sale: null };
      }

      const { data: sale, error } = await supabase
        .from("sales")
        .insert({
          company_id: companyId,
          customer_id: input.customer_id,
          reference: input.reference ?? null,
          channel: "pos",
          status: "completada",
          sale_date: new Date().toISOString().slice(0, 10),
          discount: input.discount,
          total: input.total,
          payment_method: input.payments.length === 1 ? input.payments[0].method : "mixto",
          payments: input.payments,
          amount_received: input.amount_received,
          change_amount: input.change_amount,
          tax: input.tax,
          source: "pos",
          created_by: user.id,
        } as never)
        .select("*")
        .single();

      if (error || !sale) {
        toast.error(friendlyError(error, "Error al registrar la venta"));
        return { error: error ?? new Error("insert failed"), sale: null };
      }

      await supabase.from("sale_items").insert(
        input.lines.map((l) => ({
          company_id: companyId,
          sale_id: (sale as { id: string }).id,
          product_id: l.product_id,
          description: l.name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          subtotal: l.quantity * l.unit_price - (l.discount || 0),
        }))
      );

      toast.success("Venta registrada");
      return { error: null, sale };
    },
    [companyId, user?.id, applyStock]
  );

  const annulSale = useCallback(
    async (saleId: string) => {
      const { data: items, error } = await supabase
        .from("sale_items")
        .select("product_id, quantity")
        .eq("sale_id", saleId);
      if (error) {
        toast.error(friendlyError(error, "Error al leer la venta"));
        return { error };
      }
      const valid = (items ?? []).filter((i) => i.product_id) as { product_id: string; quantity: number }[];
      if (valid.length > 0) {
        const res = await applyStock(
          valid.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
          "entrada",
          "Anulación de venta POS"
        );
        if (res.error) {
          toast.error(friendlyError(res.error, "Error al reponer stock"));
          return { error: res.error };
        }
      }
      const { error: uErr } = await supabase.from("sales").update({ status: "anulada" }).eq("id", saleId);
      if (uErr) {
        toast.error(friendlyError(uErr, "Error al anular la venta"));
        return { error: uErr };
      }
      toast.success("Venta anulada y stock repuesto");
      return { error: null };
    },
    [applyStock]
  );

  return { createSale, annulSale };
}
