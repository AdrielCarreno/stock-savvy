import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStockMovements } from "@/hooks/useStockMovements";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-elevated">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function StockChart() {
  const { movements } = useStockMovements();

  const data = useMemo(() => {
    const now = new Date();
    const days: { date: string; key: string; entradas: number; salidas: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const date = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
      days.push({ date, key, entradas: 0, salidas: 0 });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    movements.forEach((m) => {
      const key = new Date(m.created_at).toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) {
        if (m.type === "entrada") bucket.entradas += m.quantity;
        else bucket.salidas += m.quantity;
      }
    });
    return days;
  }, [movements]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Movimientos últimos 30 días</h3>
          <p className="text-xs text-muted-foreground">Entradas vs Salidas de stock</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={8} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} name="entradas" />
          <Bar dataKey="salidas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} name="salidas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
