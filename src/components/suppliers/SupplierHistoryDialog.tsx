import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import { formatARS } from "@/lib/exporters";
import { toast } from "sonner";

type PriceRow = {
  id: string;
  cost: number;
  currency: string;
  effective_date: string;
  products?: { name: string } | null;
};

type PurchaseRow = {
  id: string;
  reference: string | null;
  status: string;
  order_date: string;
  total: number;
};

export function SupplierHistoryDialog({
  supplier,
  open,
  onOpenChange,
}: {
  supplier: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);

  const load = useCallback(async () => {
    if (!supplier) return;
    setLoading(true);
    const [p, o] = await Promise.all([
      supabase
        .from("supplier_price_history")
        .select("id, cost, currency, effective_date, products(name)")
        .eq("supplier_id", supplier.id)
        .order("effective_date", { ascending: false })
        .limit(50),
      supabase
        .from("purchases")
        .select("id, reference, status, order_date, total")
        .eq("supplier_id", supplier.id)
        .order("order_date", { ascending: false })
        .limit(50),
    ]);
    if (p.error || o.error) toast.error(friendlyError(p.error ?? o.error, "Error al cargar historial"));
    setPrices((p.data ?? []) as unknown as PriceRow[]);
    setPurchases((o.data ?? []) as PurchaseRow[]);
    setLoading(false);
  }, [supplier]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">{supplier?.name ?? "Proveedor"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue="orders">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Órdenes de compra</TabsTrigger>
              <TabsTrigger value="prices">Historial de precios</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="space-y-2 pt-3">
              {purchases.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin órdenes registradas.</p>
              ) : purchases.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.reference || "Sin referencia"}</p>
                    <p className="text-xs text-muted-foreground">{o.order_date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatARS(Number(o.total ?? 0))}</p>
                    <Badge variant="secondary" className="text-[10px]">{o.status}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="prices" className="space-y-2 pt-3">
              {prices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin precios registrados.</p>
              ) : prices.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.products?.name ?? "Producto"}</p>
                    <p className="text-xs text-muted-foreground">{r.effective_date}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {r.currency === "USD" ? `USD ${Number(r.cost).toFixed(2)}` : formatARS(Number(r.cost))}
                  </p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
