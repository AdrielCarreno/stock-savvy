import { useMemo } from "react";
import { Package, TrendingDown, DollarSign, ArrowLeftRight, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { ClientsChart } from "@/components/dashboard/ClientsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const { company } = useAuth();

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.current_stock <= p.min_stock && p.min_stock > 0);
    const inventoryValue = products.reduce((acc, p) => acc + (p.cost ?? 0) * p.current_stock, 0);
    const categories = new Set(products.map((p) => p.category).filter(Boolean));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let entries7 = 0, exits7 = 0;
    movements.forEach((m) => {
      if (new Date(m.created_at) >= sevenDaysAgo) {
        if (m.type === "entrada") entries7++;
        else exits7++;
      }
    });
    return { lowStock, inventoryValue, categoriesCount: categories.size, entries7, exits7 };
  }, [products, movements]);

  const trialDaysLeft = useMemo(() => {
    if (!company?.trial_end || company.subscription_status !== "trial") return null;
    const ms = new Date(company.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [company]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 animate-fade-in">
      {trialDaysLeft !== null && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-light px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-sm font-medium text-primary">
              Período de prueba: <span className="font-semibold">{trialDaysLeft} {trialDaysLeft === 1 ? "día restante" : "días restantes"}</span>
            </p>
          </div>
          <Button size="sm" className="gradient-primary shadow-primary text-primary-foreground">
            Activar plan
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total productos"
          value={products.length.toString()}
          subtitle={`${stats.categoriesCount} ${stats.categoriesCount === 1 ? "categoría activa" : "categorías activas"}`}
          icon={Package}
          variant="primary"
        />
        <MetricCard
          title="Bajo stock"
          value={stats.lowStock.length.toString()}
          subtitle={stats.lowStock.length === 0 ? "Todo en orden" : "Requieren atención"}
          icon={TrendingDown}
          variant="warning"
        />
        <MetricCard
          title="Valor del inventario"
          value={formatCurrency(stats.inventoryValue)}
          subtitle="Precio de costo"
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Movimientos (7 días)"
          value={(stats.entries7 + stats.exits7).toString()}
          subtitle={`${stats.entries7} entradas · ${stats.exits7} salidas`}
          icon={ArrowLeftRight}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StockChart />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold">Bajo stock</h3>
              <Badge className="bg-warning-light text-warning border-warning/20 text-xs">{stats.lowStock.length}</Badge>
            </div>
            <Link to="/app/low-stock">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats.lowStock.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No hay productos en bajo stock
              </div>
            ) : (
              stats.lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-sm font-bold text-warning">{p.current_stock}</p>
                    <p className="text-xs text-muted-foreground">mín. {p.min_stock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ClientsChart />
      </div>
    </div>
  );
}
