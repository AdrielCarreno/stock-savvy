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

const data = [
  { date: "19 Ene", entradas: 45, salidas: 30 },
  { date: "22 Ene", entradas: 20, salidas: 55 },
  { date: "25 Ene", entradas: 80, salidas: 40 },
  { date: "28 Ene", entradas: 35, salidas: 60 },
  { date: "31 Ene", entradas: 60, salidas: 25 },
  { date: "03 Feb", entradas: 90, salidas: 45 },
  { date: "06 Feb", entradas: 40, salidas: 70 },
  { date: "09 Feb", entradas: 55, salidas: 35 },
  { date: "12 Feb", entradas: 75, salidas: 50 },
  { date: "15 Feb", entradas: 30, salidas: 65 },
  { date: "17 Feb", entradas: 95, salidas: 40 },
];

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
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Movimientos últimos 30 días</h3>
          <p className="text-xs text-muted-foreground">Entradas vs Salidas de stock</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={14} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(220 9% 52%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 9% 52%)" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220 14% 93%)", radius: 4 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            formatter={(value) => <span style={{ color: "hsl(220 9% 52%)" }} className="capitalize">{value}</span>}
          />
          <Bar dataKey="entradas" fill="hsl(221 83% 53%)" radius={[3, 3, 0, 0]} name="entradas" />
          <Bar dataKey="salidas" fill="hsl(168 84% 42%)" radius={[3, 3, 0, 0]} name="salidas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
