import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/types/database";
import { toast } from "sonner";

export type ProductInput = {
  name: string;
  sku: string | null;
  category: string | null;
  unit?: string;
  current_stock: number;
  min_stock: number;
  price: number | null;
  cost: number | null;
  description?: string | null;
};

export function useProducts() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar productos: " + error.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) fetchProducts();
  }, [companyId, fetchProducts]);

  const createProduct = useCallback(
    async (input: ProductInput) => {
      if (!companyId) return { error: new Error("Sin empresa asociada") };
      const { error } = await supabase.from("products").insert({
        company_id: companyId,
        name: input.name,
        sku: input.sku,
        category: input.category,
        unit: input.unit ?? "unidad",
        current_stock: input.current_stock,
        min_stock: input.min_stock,
        price: input.price,
        cost: input.cost,
        description: input.description ?? null,
      });
      if (error) {
        toast.error("Error al crear producto: " + error.message);
        return { error };
      }
      toast.success("Producto creado");
      await fetchProducts();
      return { error: null };
    },
    [companyId, fetchProducts]
  );

  const updateProduct = useCallback(
    async (id: string, input: Partial<ProductInput>) => {
      const { error } = await supabase
        .from("products")
        .update(input)
        .eq("id", id);
      if (error) {
        toast.error("Error al actualizar: " + error.message);
        return { error };
      }
      toast.success("Producto actualizado");
      await fetchProducts();
      return { error: null };
    },
    [fetchProducts]
  );

  const bulkCreateProducts = useCallback(
    async (inputs: ProductInput[]): Promise<{ success: number; failed: number }> => {
      if (!companyId) return { success: 0, failed: inputs.length };
      const CHUNK = 200;
      let success = 0;
      let failed = 0;
      for (let i = 0; i < inputs.length; i += CHUNK) {
        const chunk = inputs.slice(i, i + CHUNK).map((input) => ({
          company_id: companyId,
          name: input.name,
          sku: input.sku,
          category: input.category,
          unit: input.unit ?? "unidad",
          current_stock: input.current_stock,
          min_stock: input.min_stock,
          price: input.price,
          cost: input.cost,
          description: input.description ?? null,
        }));
        const { error, data } = await supabase.from("products").insert(chunk).select("id");
        if (error) {
          failed += chunk.length;
        } else {
          success += data?.length ?? chunk.length;
        }
      }
      await fetchProducts();
      return { success, failed };
    },
    [companyId, fetchProducts]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        toast.error("Error al eliminar: " + error.message);
        return { error };
      }
      toast.success("Producto eliminado");
      await fetchProducts();
      return { error: null };
    },
    [fetchProducts]
  );

  return { products, loading, refresh: fetchProducts, createProduct, updateProduct, deleteProduct, bulkCreateProducts };
}
