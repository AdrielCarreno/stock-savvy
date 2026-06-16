import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, ArrowLeftRight, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { StockChart } from "@/components/dashboard/StockChart";
import { ClientsChart } from "@/components/dashboard/ClientsChart";

export default function Reports() {
  const { products } = useProducts();
  const { movements } = useStockMovements();

  const stats = useMemo(() => {
    const totalStock = products.reduce((a, p) => a + p.current_stock, 0);
    const inventoryValue = products.reduce((a, p) => a + (p.cost ?? 0) * p.current_stock, 0);
    const lowStock = products.filter(p => p.current_stock <= p.min_stock && p.min_stock > 0).length;
    const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let entries30 = 0, exits30 = 0;
    movements.forEach(m => {
      if (new Date(m.created_at) >= thirty) {
        if (m.type === "entrada") entries30 += m.quantity; else exits30 += m.quantity;
      }
    });
    return { totalStock, inventoryValue, lowStock, entries30, exits30, totalMovs: movements.length };
  }, [products, movements]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const cards = [
    { title: "Productos registrados", value: products.length, icon: Package },
    { title: "Stock total (u.)", value: stats.totalStock.toLocaleString("es-AR"), icon: Package },
    { title: "Valor inventario", value: formatCurrency(stats.inventoryValue), icon: DollarSign },
    { title: "Bajo stock", value: stats.lowStock, icon: AlertTriangle },
    { title: "Entradas (30d)", value: stats.entries30.toLocaleString("es-AR"), icon: TrendingUp },
    { title: "Salidas (30d)", value: stats.exits30.toLocaleString("es-AR"), icon: TrendingDown },
    { title: "Movimientos totales", value: stats.totalMovs, icon: ArrowLeftRight },
    { title: "Rotación neta (30d)", value: (stats.entries30 - stats.exits30).toLocaleString("es-AR"), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Indicadores y resumen de tu stock y movimientos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StockChart />
        <ClientsChart />
      </div>
    </div>
  );
}
