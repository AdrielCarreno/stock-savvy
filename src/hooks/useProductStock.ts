import { friendlyError } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ProductStockRow = {
  id: string;
  company_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
};

export function useProductStock() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [stock, setStock] = useState<ProductStockRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("product_stock")
      .select("id, company_id, product_id, warehouse_id, quantity")
      .eq("company_id", companyId);
    if (error) {
      toast.error(friendlyError(error, "Error al cargar stock por depósito"));
    } else {
      setStock((data ?? []) as ProductStockRow[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchStock();
  }, [companyId, fetchStock]);

  return { stock, loading, refresh: fetchStock };
}
