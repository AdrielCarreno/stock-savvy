import { friendlyError } from "@/lib/errors";
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

function signedDelta(type: "entrada" | "salida", qty: number) {
  return type === "entrada" ? qty : -qty;
}

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
      toast.error(friendlyError(error, "Error al cargar movimientos"));
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
        toast.error(friendlyError(mErr, "Error al registrar movimiento"));
        return { error: mErr };
      }

      const { error: uErr } = await supabase
        .from("products")
        .update({ current_stock: newStock })
        .eq("id", input.product_id);
      if (uErr) {
        toast.error(friendlyError(uErr, "Error al actualizar stock"));
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

  const updateMovement = useCallback(
    async (
      id: string,
      previous: { product_id: string; type: "entrada" | "salida"; quantity: number },
      input: {
        product_id: string;
        type: "entrada" | "salida";
        quantity: number;
        reason?: string | null;
        sale_type?: "mayorista" | "minorista" | null;
        logistics?: string | null;
        movement_date?: string;
      }
    ) => {
      if (!companyId) return { error: new Error("No autenticado") };

      // Reverse previous effect from product stock
      const prevDelta = signedDelta(previous.type, previous.quantity);
      const newDelta = signedDelta(input.type, input.quantity);

      // Fetch current product (and if product changed, also old one)
      const productIds = Array.from(new Set([previous.product_id, input.product_id]));
      const { data: prods, error: pErr } = await supabase
        .from("products")
        .select("id, current_stock, name")
        .in("id", productIds);
      if (pErr || !prods) {
        toast.error("Error al cargar productos");
        return { error: pErr ?? new Error("not found") };
      }

      const updates: { id: string; newStock: number; name: string }[] = [];

      if (previous.product_id === input.product_id) {
        const p = prods.find((x) => x.id === input.product_id);
        if (!p) return { error: new Error("not found") };
        const newStock = p.current_stock - prevDelta + newDelta;
        if (newStock < 0) {
          toast.error(`Stock insuficiente. Disponible tras revertir: ${p.current_stock - prevDelta}`);
          return { error: new Error("insufficient") };
        }
        updates.push({ id: p.id, newStock, name: p.name });
      } else {
        const oldP = prods.find((x) => x.id === previous.product_id);
        const newP = prods.find((x) => x.id === input.product_id);
        if (!oldP || !newP) return { error: new Error("not found") };
        const oldNewStock = oldP.current_stock - prevDelta;
        const newNewStock = newP.current_stock + newDelta;
        if (oldNewStock < 0 || newNewStock < 0) {
          toast.error("Stock insuficiente para la modificación");
          return { error: new Error("insufficient") };
        }
        updates.push({ id: oldP.id, newStock: oldNewStock, name: oldP.name });
        updates.push({ id: newP.id, newStock: newNewStock, name: newP.name });
      }

      const { error: mErr } = await supabase
        .from("stock_movements")
        .update({
          product_id: input.product_id,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason ?? null,
          sale_type: input.sale_type ?? null,
          logistics: input.logistics ?? null,
          movement_date: input.movement_date ?? new Date().toISOString(),
        })
        .eq("id", id);
      if (mErr) {
        toast.error(friendlyError(mErr, "Error al actualizar movimiento"));
        return { error: mErr };
      }

      for (const u of updates) {
        const { error: uErr } = await supabase
          .from("products")
          .update({ current_stock: u.newStock })
          .eq("id", u.id);
        if (uErr) {
          toast.error(friendlyError(uErr, "Error al actualizar stock"));
          return { error: uErr };
        }
      }

      toast.success("Movimiento actualizado");
      await fetchMovements();
      return { error: null };
    },
    [companyId, fetchMovements]
  );

  const transferStock = useCallback(
    async (input: {
      product_id: string;
      from_warehouse_id: string;
      to_warehouse_id: string;
      quantity: number;
      reason?: string | null;
    }) => {
      if (!companyId || !user?.id) return { error: new Error("No autenticado") };
      if (input.from_warehouse_id === input.to_warehouse_id) {
        toast.error("Elegí depósitos distintos");
        return { error: new Error("same warehouse") };
      }
      if (input.quantity <= 0) {
        toast.error("La cantidad debe ser mayor a cero");
        return { error: new Error("invalid qty") };
      }

      const { data: origin, error: oErr } = await supabase
        .from("product_stock")
        .select("id, quantity")
        .eq("product_id", input.product_id)
        .eq("warehouse_id", input.from_warehouse_id)
        .maybeSingle();
      if (oErr) {
        toast.error(friendlyError(oErr, "Error al leer stock de origen"));
        return { error: oErr };
      }
      if (!origin || origin.quantity < input.quantity) {
        toast.error(`Stock insuficiente en el depósito de origen (${origin?.quantity ?? 0})`);
        return { error: new Error("insufficient") };
      }

      const { data: dest, error: dErr } = await supabase
        .from("product_stock")
        .select("id, quantity")
        .eq("product_id", input.product_id)
        .eq("warehouse_id", input.to_warehouse_id)
        .maybeSingle();
      if (dErr) {
        toast.error(friendlyError(dErr, "Error al leer stock de destino"));
        return { error: dErr };
      }

      const { error: upErr } = await supabase
        .from("product_stock")
        .update({ quantity: origin.quantity - input.quantity })
        .eq("id", origin.id);
      if (upErr) {
        toast.error(friendlyError(upErr, "Error al descontar stock"));
        return { error: upErr };
      }

      const destErr = dest
        ? (await supabase
            .from("product_stock")
            .update({ quantity: dest.quantity + input.quantity })
            .eq("id", dest.id)).error
        : (await supabase.from("product_stock").insert({
            company_id: companyId,
            product_id: input.product_id,
            warehouse_id: input.to_warehouse_id,
            quantity: input.quantity,
          })).error;
      if (destErr) {
        // revertir origen
        await supabase.from("product_stock").update({ quantity: origin.quantity }).eq("id", origin.id);
        toast.error(friendlyError(destErr, "Error al acreditar stock"));
        return { error: destErr };
      }

      await supabase.from("stock_movements").insert({
        company_id: companyId,
        product_id: input.product_id,
        user_id: user.id,
        type: "salida",
        quantity: input.quantity,
        reason: input.reason ?? "Transferencia entre depósitos",
        from_warehouse_id: input.from_warehouse_id,
        to_warehouse_id: input.to_warehouse_id,
        movement_date: new Date().toISOString(),
      });

      toast.success("Transferencia registrada");
      await fetchMovements();
      return { error: null };
    },
    [companyId, user?.id, fetchMovements]
  );

  return { movements, loading, refresh: fetchMovements, createMovement, updateMovement, transferStock };
}
