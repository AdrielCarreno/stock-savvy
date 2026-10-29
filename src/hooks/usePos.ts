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
  sale_type: "minorista" | "mayorista";
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

  /** Registra la venta completa en el servidor en una sola operación (idempotente por opId). */
  const createSale = useCallback(
    async (input: PosSaleInput & { opId?: string }) => {
      if (!companyId || !user?.id) {
        toast.error("No autenticado");
        return { error: new Error("No autenticado"), sale: null };
      }
      if (input.lines.length === 0) {
        toast.error("El carrito está vacío");
        return { error: new Error("empty"), sale: null };
      }
      const opId = input.opId ?? crypto.randomUUID();
      const { data, error } = await (supabase as any).rpc("create_pos_sale", {
        p_op_id: opId,
        p_sale: {
          customer_id: input.customer_id,
          reference: input.reference ?? null,
          sale_date: new Date().toISOString().slice(0, 10),
          discount: input.discount,
          total: input.total,
          payment_method: input.payments.length === 1 ? input.payments[0].method : "mixto",
          payments: input.payments,
          amount_received: input.amount_received,
          change_amount: input.change_amount,
          tax: input.tax,
        },
        p_lines: input.lines.map((l) => ({
          product_id: l.product_id,
          description: l.name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          sale_type: l.sale_type,
        })),
      });
      if (error || !data) {
        toast.error(friendlyError(error, "Error al registrar la venta"));
        return { error: error ?? new Error("insert failed"), sale: null };
      }
      toast.success("Venta registrada");
      return { error: null, sale: data };
    },
    [companyId, user?.id]
  );

  const annulSale = useCallback(async (saleId: string) => {
    const { error } = await (supabase as any).rpc("annul_sale", { p_sale_id: saleId });
    if (error) {
      toast.error(friendlyError(error, "Error al anular la venta"));
      return { error };
    }
    toast.success("Venta anulada y stock repuesto");
    return { error: null };
  }, []);

  return { createSale, annulSale };
}
