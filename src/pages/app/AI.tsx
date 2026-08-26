import { Sparkles, Bot, LineChart, MessageSquare } from "lucide-react";

const previews = [
  { icon: LineChart, title: "Predicción de reposición", text: "Sugerencias de cuánto y cuándo comprar según tu histórico de ventas." },
  { icon: MessageSquare, title: "Consultas en lenguaje natural", text: "Preguntá \"¿qué producto se estancó este mes?\" y obtené la respuesta." },
  { icon: Bot, title: "Alertas inteligentes", text: "Avisos automáticos de quiebres de stock, vencimientos y desvíos de costos." },
];

export default function AI() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Próximamente
        </span>
        <h2 className="mt-3 text-xl font-bold text-foreground md:text-2xl">Inteligencia Artificial</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Estamos desarrollando el asistente de OneStock para que tu inventario se gestione solo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {previews.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-5 shadow-card opacity-80">
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">{p.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
