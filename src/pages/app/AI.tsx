import { Sparkles, Bot, LineChart, MessageSquare } from "lucide-react";

const previews = [
  { icon: LineChart, title: "Predicción de reposición", text: "Sugerencias de cuánto y cuándo comprar según tu histórico de ventas." },
  { icon: MessageSquare, title: "Consultas en lenguaje natural", text: "Preguntá \"¿qué producto se estancó este mes?\" y obtené la respuesta." },
  { icon: Bot, title: "Alertas inteligentes", text: "Avisos automáticos de quiebres de stock, vencimientos y desvíos de costos." },
];

export default function AI() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden border-y border-border bg-card px-6 py-12 text-left md:px-10 md:py-16">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <span className="inline-block border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Próximamente
        </span>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-normal text-foreground md:text-5xl">Inteligencia Artificial</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Estamos desarrollando el asistente de OneStock para que tu inventario se gestione solo.
        </p>
      </div>

      <div className="grid grid-cols-1 border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
        {previews.map((p) => (
          <div key={p.title} className="border-b border-border bg-card p-6 opacity-80 last:border-b-0 md:border-b-0">
            <p.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">{p.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
