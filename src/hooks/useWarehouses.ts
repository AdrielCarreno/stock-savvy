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
      toast.error("Error al cargar depósitos: " + error.message);
    } else {
      setWarehouses((data ?? []) as Warehouse[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchWarehouses();
  }, [companyId, fetchWarehouses]);

  return { warehouses, loading, refresh: fetchWarehouses };
}
