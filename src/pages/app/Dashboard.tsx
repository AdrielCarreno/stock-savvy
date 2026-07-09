import { useEffect, useMemo, useState } from "react";
import { Package, TrendingDown, DollarSign, ArrowLeftRight, ArrowRight, Receipt, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { ClientsChart } from "@/components/dashboard/ClientsChart";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { supabase } from "@/integrations/supabase/client";

type Aggregates = {
  salesCount: number;
  salesTotal: number;
  purchasesTotal: number;
  topProducts: { name: string; qty: number }[];
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const [agg, setAgg] = useState<Aggregates>({ salesCount: 0, salesTotal: 0, purchasesTotal: 0, topProducts: [] });

  useEffect(() => {
    (async () => {
      const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [sales, purchases, saleItems] = await Promise.all([
        supabase.from("sales").select("total, created_at").gte("created_at", thirtyAgo),
        supabase.from("purchases").select("total, created_at").gte("created_at", thirtyAgo),
        supabase.from("sale_items").select("product_id, quantity, products(name), created_at").gte("created_at", thirtyAgo),
      ]);
      const salesTotal = (sales.data ?? []).reduce((a: number, r: any) => a + Number(r.total ?? 0), 0);
      const purchasesTotal = (purchases.data ?? []).reduce((a: number, r: any) => a + Number(r.total ?? 0), 0);
      const perProduct = new Map<string, { name: string; qty: number }>();
      (saleItems.data ?? []).forEach((it: any) => {
        const name = it.products?.name ?? "—";
        const prev = perProduct.get(it.product_id) ?? { name, qty: 0 };
        prev.qty += Number(it.quantity ?? 0);
        perProduct.set(it.product_id, prev);
      });
      const topProducts = Array.from(perProduct.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
      setAgg({ salesCount: sales.data?.length ?? 0, salesTotal, purchasesTotal, topProducts });
    })();
  }, [movements.length]);

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.current_stock <= p.min_stock && p.min_stock > 0);
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let entries30 = 0, exits30 = 0;
    movements.forEach((m: any) => {
      if (new Date(m.created_at) >= thirtyAgo) {
        if (m.type === "entrada") entries30++; else exits30++;
      }
    });
    return { lowStock, entries30, exits30 };
  }, [products, movements]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Gráficos arriba */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><StockChart /></div>
        <div><ClientsChart /></div>
      </div>

      {/* KPIs solicitados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ventas totales (30d)"
          value={formatCurrency(agg.salesTotal)}
          subtitle={`${agg.salesCount} operaciones`}
          icon={Receipt}
          variant="success"
        />
        <MetricCard
          title="Movimientos (30d)"
          value={stats.entries30 + stats.exits30}
          subtitle={`${stats.entries30} entradas · ${stats.exits30} salidas`}
          icon={ArrowLeftRight}
          variant="primary"
        />
        <MetricCard
          title="Entradas ($) 30d"
          value={formatCurrency(agg.purchasesTotal)}
          subtitle="Compras del período"
          icon={ArrowDownCircle}
          variant="default"
        />
        <MetricCard
          title="Salidas ($) 30d"
          value={formatCurrency(agg.salesTotal)}
          subtitle="Ventas del período"
          icon={ArrowUpCircle}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Productos más vendidos */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Productos más vendidos (30d)
            </h2>
            <Link to="/app/movements?tab=sales">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver ventas<ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {agg.topProducts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sin ventas en los últimos 30 días.</div>
            ) : agg.topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-5 py-3">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-sm font-bold text-primary">{p.qty} u.</p>
              </div>
            ))}
          </div>
        </div>

        {/* Productos bajo stock */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-warning" /> Productos bajo stock
              <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs text-warning">{stats.lowStock.length}</span>
            </h2>
            <Link to="/app/low-stock">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver todos<ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats.lowStock.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay productos en bajo stock</div>
            ) : stats.lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-bold text-warning">{p.current_stock}</p>
                  <p className="text-xs text-muted-foreground">mín. {p.min_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
