import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-elevated">
        <p className="text-xs font-semibold text-foreground">{item.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.payload.fill }} />
          <span className="text-muted-foreground">Unidades:</span>
          <span className="font-semibold text-foreground">{item.value}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.payload.percent.toFixed(1)}% del total
        </p>
      </div>
    );
  }
  return null;
};

export function ClientsChart() {
  const { products } = useProducts();

  const { data, totalUnits, totalClients } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    products.forEach((p) => {
      const qty = Math.max(0, p.current_stock ?? 0);
      if (qty <= 0) return;
      const key = p.client?.trim() || "Sin cliente";
      map.set(key, (map.get(key) ?? 0) + qty);
      total += qty;
    });
    const arr = Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return { data: arr, totalUnits: total, totalClients: arr.filter((d) => d.name !== "Sin cliente").length };
  }, [products]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mercadería por cliente</h3>
            <p className="text-xs text-muted-foreground">
              {totalClients} {totalClients === 1 ? "cliente" : "clientes"} · {totalUnits} unidades
            </p>
          </div>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
          Asigná clientes a tus productos para ver la distribución acá.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value, entry: any) => (
                <span className="text-muted-foreground">
                  {value} · <span className="text-foreground font-medium">{entry?.payload?.percent?.toFixed(1)}%</span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
