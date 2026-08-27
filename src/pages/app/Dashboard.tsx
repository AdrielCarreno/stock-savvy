import { useEffect, useMemo, useState } from "react";
import {
  Package,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowLeftRight,
  ArrowRight,
  Receipt,
  RefreshCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { supabase } from "@/integrations/supabase/client";
import { formatARS } from "@/lib/exporters";

const DONUT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

type SalePoint = { total: number; date: Date };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-elevated">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color ?? e.payload?.fill }} />
          <span className="capitalize text-muted-foreground">{e.name}:</span>
          <span className="font-semibold text-foreground">{e.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const [sales, setSales] = useState<SalePoint[]>([]);
  const [soldQty, setSoldQty] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const [salesRes, itemsRes] = await Promise.all([
        supabase.from("sales").select("total, sale_date, created_at").gte("created_at", since),
        supabase.from("sale_items").select("product_id, quantity, created_at").gte("created_at", since),
      ]);
      setSales(
        (salesRes.data ?? []).map((r: any) => ({
          total: Number(r.total ?? 0),
          date: new Date(r.sale_date ?? r.created_at),
        }))
      );
      const map = new Map<string, number>();
      (itemsRes.data ?? []).forEach((it: any) => {
        map.set(it.product_id, (map.get(it.product_id) ?? 0) + Number(it.quantity ?? 0));
      });
      setSoldQty(map);
    })();
  }, [movements.length]);

  /* ---------- KPIs ---------- */
  const kpis = useMemo(() => {
    const inventoryValue = products.reduce((a, p) => a + Number(p.cost ?? 0) * p.current_stock, 0);
    const inventorySale = products.reduce(
      (a, p) => a + Number(p.price_retail ?? p.price ?? 0) * p.current_stock,
      0
    );
    const lowStock = products.filter((p) => p.min_stock > 0 && p.current_stock <= p.min_stock);

    const now = Date.now();
    const d30 = now - 30 * 24 * 60 * 60 * 1000;
    const d60 = now - 60 * 24 * 60 * 60 * 1000;
    const sales30 = sales.filter((s) => s.date.getTime() >= d30);
    const salesPrev = sales.filter((s) => s.date.getTime() >= d60 && s.date.getTime() < d30);
    const total30 = sales30.reduce((a, s) => a + s.total, 0);
    const totalPrev = salesPrev.reduce((a, s) => a + s.total, 0);
    const variation = totalPrev > 0 ? ((total30 - totalPrev) / totalPrev) * 100 : 0;

    // Rotación de stock = unidades vendidas (30d) / stock promedio
    const soldUnits30 = movements
      .filter((m) => m.type === "salida" && new Date(m.movement_date).getTime() >= d30)
      .reduce((a, m) => a + m.quantity, 0);
    const totalStock = products.reduce((a, p) => a + p.current_stock, 0);
    const rotation = totalStock > 0 ? soldUnits30 / totalStock : 0;

    return { inventoryValue, inventorySale, lowStock, total30, totalPrev, variation, soldUnits30, rotation, salesCount: sales30.length };
  }, [products, sales, movements]);

  /* ---------- Más y menos vendidos ---------- */
  const ranking = useMemo(() => {
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name,
      qty: soldQty.get(p.id) ?? 0,
      stock: p.current_stock,
    }));
    const sorted = rows.slice().sort((a, b) => b.qty - a.qty);
    return {
      top: sorted.slice(0, 5),
      bottom: sorted.filter((r) => r.qty === 0).slice(0, 5).length
        ? sorted.filter((r) => r.qty === 0).slice(0, 5)
        : sorted.slice(-5).reverse(),
    };
  }, [products, soldQty]);

  /* ---------- Comparativa por período (6 meses) ---------- */
  const monthly = useMemo(() => {
    const buckets: { label: string; key: string; ventas: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString("es-AR", { month: "short" }),
        key: `${d.getFullYear()}-${d.getMonth()}`,
        ventas: 0,
      });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    sales.forEach((s) => {
      const b = map.get(`${s.date.getFullYear()}-${s.date.getMonth()}`);
      if (b) b.ventas += s.total;
    });
    return buckets.map((b) => ({ ...b, ventas: Math.round(b.ventas) }));
  }, [sales]);

  /* ---------- Dona por categoría (valor de inventario) ---------- */
  const donut = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category?.trim() || "Sin categoría";
      map.set(cat, (map.get(cat) ?? 0) + Number(p.cost ?? 0) * p.current_stock);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-5 animate-fade-in md:space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Valor total de inventario"
          value={formatARS(kpis.inventoryValue)}
          subtitle={`A venta: ${formatARS(kpis.inventorySale)}`}
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard
          title="Ventas (30 días)"
          value={formatARS(kpis.total30)}
          subtitle={`${kpis.salesCount} operaciones`}
          icon={Receipt}
          variant="success"
        />
        <MetricCard
          title="Rotación de stock"
          value={`${kpis.rotation.toFixed(2)}x`}
          subtitle={`${kpis.soldUnits30} u. vendidas en 30 días`}
          icon={RefreshCcw}
          variant="default"
        />
        <MetricCard
          title="Productos bajo stock"
          value={kpis.lowStock.length}
          subtitle="Requieren reposición"
          icon={TrendingDown}
          variant="warning"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Comparativa de ventas por período</h2>
            <span className={`flex items-center gap-1 text-xs font-semibold ${kpis.variation >= 0 ? "text-success" : "text-destructive"}`}>
              {kpis.variation >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {kpis.variation.toFixed(1)}% vs. mes anterior
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">Inventario por categoría</h2>
          {donut.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-center text-xs text-muted-foreground">
              Cargá costos y stock para ver la distribución.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                    {donut.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <StockChart />

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-success" /> Productos más vendidos
            </h2>
            <Link to="/app/reports">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Reportes<ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {ranking.top.filter((r) => r.qty > 0).length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Todavía no hay ventas registradas.</p>
            ) : (
              ranking.top.filter((r) => r.qty > 0).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</p>
                  <p className="ml-3 text-sm font-bold text-success">{r.qty} u.</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-warning" /> Productos menos vendidos
            </h2>
            <Link to="/app/low-stock">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Alertas<ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {ranking.bottom.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sin datos suficientes.</p>
            ) : (
              ranking.bottom.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.stock} u. en stock</p>
                  </div>
                  <p className="ml-3 text-sm font-bold text-muted-foreground">{r.qty} u.</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bajo stock */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-warning" /> Reposición sugerida
            <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs text-warning">{kpis.lowStock.length}</span>
          </h2>
          <Link to="/app/movements">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <ArrowLeftRight className="h-3 w-3" />Movimientos
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {kpis.lowStock.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No hay productos por debajo del mínimo.</p>
          ) : (
            kpis.lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
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
  );
}
