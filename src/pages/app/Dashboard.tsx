import { Package, TrendingDown, DollarSign, ArrowLeftRight, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const lowStockProducts = [
  { id: 1, name: "Aceite de girasol 1L", sku: "ACE-001", stock: 3, minimum: 20, category: "Aceites" },
  { id: 2, name: "Harina 000 x 1kg", sku: "HAR-002", stock: 5, minimum: 15, category: "Harinas" },
  { id: 3, name: "Arroz largo fino 1kg", sku: "ARR-003", stock: 8, minimum: 25, category: "Granos" },
  { id: 4, name: "Azúcar blanca 1kg", sku: "AZU-001", stock: 2, minimum: 20, category: "Azúcares" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Trial banner */}
      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-light px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm font-medium text-primary">
            Período de prueba: <span className="font-semibold">11 días restantes</span>
          </p>
        </div>
        <Button size="sm" className="gradient-primary shadow-primary text-primary-foreground">
          Activar plan
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total productos"
          value="148"
          subtitle="18 categorías activas"
          icon={Package}
          variant="primary"
          trend={{ value: 12, label: "vs mes anterior" }}
        />
        <MetricCard
          title="Bajo stock"
          value="4"
          subtitle="Requieren atención"
          icon={TrendingDown}
          variant="warning"
        />
        <MetricCard
          title="Valor del inventario"
          value="$2.840.500"
          subtitle="Precio de costo"
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Movimientos (7 días)"
          value="37"
          subtitle="23 entradas · 14 salidas"
          icon={ArrowLeftRight}
          variant="default"
        />
      </div>

      {/* Chart + Low stock */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StockChart />
        </div>

        {/* Low stock quick list */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold">Bajo stock</h3>
              <Badge className="bg-warning-light text-warning border-warning/20 text-xs">{lowStockProducts.length}</Badge>
            </div>
            <Link to="/app/low-stock">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground">
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-bold text-warning">{p.stock}</p>
                  <p className="text-xs text-muted-foreground">mín. {p.minimum}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
