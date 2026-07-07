import { useEffect, useMemo, useState } from "react";
import { Package, TrendingDown, DollarSign, ArrowLeftRight, AlertTriangle, ArrowRight, Plug, Receipt, ShoppingCart, Users, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { ClientsChart } from "@/components/dashboard/ClientsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { supabase } from "@/integrations/supabase/client";

type Aggregates = {
  salesCount: number;
  salesTotal: number;
  purchasesCount: number;
  purchasesTotal: number;
  customersCount: number;
  suppliersCount: number;
  topProducts: { name: string; qty: number }[];
};

export default function Dashboard() {
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const [agg, setAgg] = useState<Aggregates>({ salesCount: 0, salesTotal: 0, purchasesCount: 0, purchasesTotal: 0, customersCount: 0, suppliersCount: 0, topProducts: [] });

  useEffect(() => {
    (async () => {
      const [sales, purchases, customers, suppliers, saleItems] = await Promise.all([
        supabase.from("sales").select("total"),
        supabase.from("purchases").select("total"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
        supabase.from("sale_items").select("product_id, quantity, products(name)"),
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
      setAgg({
        salesCount: sales.data?.length ?? 0,
        salesTotal,
        purchasesCount: purchases.data?.length ?? 0,
        purchasesTotal,
        customersCount: customers.count ?? 0,
        suppliersCount: suppliers.count ?? 0,
        topProducts,
      });
    })();
  }, [movements.length]);

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.current_stock <= p.min_stock && p.min_stock > 0);
    const inventoryValue = products.reduce((acc, p) => acc + (p.cost ?? 0) * p.current_stock, 0);
    const totalStock = products.reduce((acc, p) => acc + p.current_stock, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let entries7 = 0, exits7 = 0;
    movements.forEach((m) => {
      if (new Date(m.created_at) >= sevenDaysAgo) {
        if (m.type === "entrada") entries7++; else exits7++;
      }
    });
    return { lowStock, inventoryValue, totalStock, entries7, exits7 };
  }, [products, movements]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const recentMovements = movements.slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Productos" value={products.length} subtitle="Total registrado" icon={Package} variant="primary" />
        <MetricCard title="Stock total" value={stats.totalStock} subtitle="Unidades en depósito" icon={Package} variant="default" />
        <MetricCard title="Bajo stock" value={stats.lowStock.length} subtitle={stats.lowStock.length === 0 ? "Todo en orden" : "Requieren atención"} icon={TrendingDown} variant="warning" />
        <MetricCard title="Valor inventario" value={formatCurrency(stats.inventoryValue)} subtitle="A precio costo" icon={DollarSign} variant="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ventas" value={agg.salesCount} subtitle={formatCurrency(agg.salesTotal)} icon={Receipt} variant="success" />
        <MetricCard title="Compras" value={agg.purchasesCount} subtitle={formatCurrency(agg.purchasesTotal)} icon={ShoppingCart} variant="primary" />
        <MetricCard title="Clientes" value={agg.customersCount} subtitle="Cartera activa" icon={Users} variant="default" />
        <MetricCard title="Proveedores" value={agg.suppliersCount} subtitle="Base cargada" icon={Truck} variant="default" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard title="Movimientos (7d)" value={stats.entries7 + stats.exits7} subtitle={`${stats.entries7} entradas · ${stats.exits7} salidas`} icon={ArrowLeftRight} variant="default" />
        <MetricCard title="Integraciones" value="Conectá tus canales" subtitle="Mercado Libre, Tienda Nube, Shopify..." icon={Plug} variant="primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><StockChart /></div>
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Alertas de stock</h2>
              <Badge className="bg-warning-light text-warning border-warning/20 text-xs">{stats.lowStock.length}</Badge>
            </div>
            <Link to="/app/low-stock"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver todos<ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y divide-border">
            {stats.lowStock.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay productos en bajo stock</div>
            ) : stats.lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}</p></div>
                <div className="ml-3 text-right"><p className="text-sm font-bold text-warning">{p.current_stock}</p><p className="text-xs text-muted-foreground">mín. {p.min_stock}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><ClientsChart /></div>
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Productos más vendidos</h2>
            <Link to="/app/sales"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver ventas<ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y divide-border">
            {agg.topProducts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sin ventas aún.</div>
            ) : agg.topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-5 py-3">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-sm font-bold text-primary">{p.qty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Movimientos recientes</h2>
          <Link to="/app/movements"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver todos<ArrowRight className="h-3 w-3" /></Button></Link>
        </div>
        <div className="divide-y divide-border">
          {recentMovements.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sin movimientos registrados.</div>
          ) : recentMovements.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.product_name ?? "Producto"}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.type} · {new Date(m.created_at).toLocaleDateString("es-AR")}</p>
              </div>
              <div className="ml-3 text-right">
                <p className={`text-sm font-bold ${m.type === "entrada" ? "text-success" : "text-destructive"}`}>
                  {m.type === "entrada" ? "+" : "-"}{m.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
