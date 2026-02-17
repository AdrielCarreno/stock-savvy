import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const lowStockProducts = [
  { id: 1, name: "Aceite de girasol 1L", sku: "ACE-001", stock: 3, minStock: 20, category: "Aceites", costPrice: 1200, salePrice: 1650 },
  { id: 2, name: "Harina 000 x 1kg", sku: "HAR-002", stock: 5, minStock: 15, category: "Harinas", costPrice: 450, salePrice: 650 },
  { id: 3, name: "Arroz largo fino 1kg", sku: "ARR-003", stock: 8, minStock: 25, category: "Granos", costPrice: 380, salePrice: 550 },
  { id: 4, name: "Azúcar blanca 1kg", sku: "AZU-001", stock: 2, minStock: 20, category: "Azúcares", costPrice: 420, salePrice: 600 },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function StockBar({ stock, min }: { stock: number; min: number }) {
  const pct = Math.min(100, (stock / min) * 100);
  const color = pct <= 25 ? "bg-destructive" : pct <= 60 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

export default function LowStock() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Alertas de Bajo Stock</h2>
          <p className="text-sm text-muted-foreground">Productos que necesitan reposición</p>
        </div>
        <Link to="/app/movements">
          <Button className="gap-2 gradient-primary shadow-primary text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
            Registrar entrada
          </Button>
        </Link>
      </div>

      {/* Alert banner */}
      {lowStockProducts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {lowStockProducts.length} productos por debajo del stock mínimo
            </p>
            <p className="text-xs text-warning/80 mt-1">
              Revisá el listado y registrá las entradas necesarias para evitar faltantes.
            </p>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lowStockProducts.map((p) => {
          const stockPct = Math.min(100, (p.stock / p.minStock) * 100);
          const urgency = stockPct <= 25 ? "critical" : "warning";
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-card p-5 shadow-card ${
                urgency === "critical" ? "border-destructive/30" : "border-warning/30"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-light">
                  <Package className="h-4 w-4 text-warning" />
                </div>
                <Badge className={urgency === "critical"
                  ? "bg-destructive/10 text-destructive border-destructive/20 text-xs"
                  : "bg-warning-light text-warning border-warning/20 text-xs"
                }>
                  {urgency === "critical" ? "🔴 Crítico" : "🟡 Bajo"}
                </Badge>
              </div>
              <h3 className="mb-1 font-semibold text-foreground">{p.name}</h3>
              <code className="text-xs text-muted-foreground">{p.sku}</code>
              <Badge variant="secondary" className="ml-2 text-xs">{p.category}</Badge>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock actual</span>
                  <span className={`font-bold ${urgency === "critical" ? "text-destructive" : "text-warning"}`}>
                    {p.stock} unidades
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stock mínimo</span>
                  <span className="text-foreground">{p.minStock} unidades</span>
                </div>
                <StockBar stock={p.stock} min={p.minStock} />
                <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground">Faltan reponer</span>
                  <span className="font-semibold text-foreground">{Math.max(0, p.minStock - p.stock)} ud.</span>
                </div>
              </div>

              <Link to="/app/movements">
                <Button variant="outline" size="sm" className="mt-4 w-full gap-2 text-xs">
                  <ArrowRight className="h-3 w-3" />
                  Registrar entrada
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {lowStockProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-light">
            <Package className="h-7 w-7 text-success" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground">¡Todo bien por aquí!</h3>
          <p className="text-sm text-muted-foreground">Ningún producto está por debajo del stock mínimo.</p>
        </div>
      )}
    </div>
  );
}
