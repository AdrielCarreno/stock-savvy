import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type MovementWithProduct = {
  id: string;
  product_id: string;
  type: "entrada" | "salida";
  quantity: number;
  reason: string | null;
  created_at: string;
  movement_date: string;
  sale_type: "mayorista" | "minorista" | null;
  logistics: string | null;
  user_id: string;
  product_name: string;
  product_sku: string | null;
  product_price: number | null;
  product_cost: number | null;
  value: number;
};

export function useStockMovements() {
  const { profile, user } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("stock_movements")
      .select("id, product_id, type, quantity, reason, created_at, movement_date, sale_type, logistics, user_id, products(name, sku, price, cost)")
      .eq("company_id", companyId)
      .order("movement_date", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Error al cargar movimientos: " + error.message);
    } else {
      const mapped = (data ?? []).map((m: any) => {
        const price = m.products?.price ?? null;
        const cost = m.products?.cost ?? null;
        const unit = m.type === "entrada" ? (cost ?? price ?? 0) : (price ?? cost ?? 0);
        return {
          id: m.id,
          product_id: m.product_id,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          created_at: m.created_at,
          movement_date: m.movement_date ?? m.created_at,
          sale_type: m.sale_type ?? null,
          logistics: m.logistics ?? null,
          user_id: m.user_id,
          product_name: m.products?.name ?? "Producto eliminado",
          product_sku: m.products?.sku ?? null,
          product_price: price,
          product_cost: cost,
          value: Number(unit) * m.quantity,
        };
      });
      setMovements(mapped);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchMovements();
  }, [companyId, fetchMovements]);

  const createMovement = useCallback(
    async (input: {
      product_id: string;
      type: "entrada" | "salida";
      quantity: number;
      reason?: string;
      sale_type?: "mayorista" | "minorista" | null;
      logistics?: string | null;
      movement_date?: string;
    }) => {
      if (!companyId || !user?.id) return { error: new Error("No autenticado") };

      // Get current stock
      const { data: product, error: pErr } = await supabase
        .from("products")
        .select("current_stock, name")
        .eq("id", input.product_id)
        .maybeSingle();
      if (pErr || !product) {
        toast.error("Producto no encontrado");
        return { error: pErr ?? new Error("not found") };
      }

      const newStock =
        input.type === "entrada"
          ? product.current_stock + input.quantity
          : product.current_stock - input.quantity;

      if (newStock < 0) {
        toast.error(`Stock insuficiente. Disponible: ${product.current_stock}`);
        return { error: new Error("insufficient stock") };
      }

      // Insert movement
      const { error: mErr } = await supabase.from("stock_movements").insert({
        company_id: companyId,
        product_id: input.product_id,
        user_id: user.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason ?? null,
        sale_type: input.sale_type ?? null,
        logistics: input.logistics ?? null,
        movement_date: input.movement_date ?? new Date().toISOString(),
      });
      if (mErr) {
        toast.error("Error al registrar movimiento: " + mErr.message);
        return { error: mErr };
      }

      // Update product stock
      const { error: uErr } = await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", input.product_id);
      if (uErr) {
        toast.error("Error al actualizar stock: " + uErr.message);
        return { error: uErr };
      }

      toast.success(
        input.type === "entrada"
          ? `+${input.quantity} unidades de ${product.name}`
          : `-${input.quantity} unidades de ${product.name}`
      );
      await fetchMovements();
      return { error: null };
    },
    [companyId, user?.id, fetchMovements]
  );

  return { movements, loading, refresh: fetchMovements, createMovement };
}
