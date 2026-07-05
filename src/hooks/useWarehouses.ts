import { friendlyError } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Warehouse = {
  id: string;
  company_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function useWarehouses() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("company_id", companyId)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    if (error) {
      toast.error(friendlyError(error, "Error al cargar depósitos"));
    } else {
      setWarehouses((data ?? []) as Warehouse[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchWarehouses();
  }, [companyId, fetchWarehouses]);

  const createWarehouse = useCallback(
    async (name: string) => {
      if (!companyId) return { error: new Error("Sin empresa") };
      const trimmed = name.trim();
      if (!trimmed) return { error: new Error("Nombre requerido") };
      const { error } = await supabase
        .from("warehouses")
        .insert({ company_id: companyId, name: trimmed, is_default: false });
      if (error) {
        toast.error(friendlyError(error, "Error al crear depósito"));
        return { error };
      }
      toast.success(`Depósito "${trimmed}" creado`);
      await fetchWarehouses();
      return { error: null };
    },
    [companyId, fetchWarehouses]
  );

  return { warehouses, loading, refresh: fetchWarehouses, createWarehouse };
}
