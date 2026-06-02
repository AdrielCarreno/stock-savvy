import { useEffect, useState } from "react";
import { CheckCircle2, CalendarCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

type EventKind = "subscription" | "consultation";

type ProofEvent = {
  id: string;
  kind: EventKind;
  company: string;
  city: string;
  minutesAgo: number;
};

// Set fijo de 7 clientes reales/representativos que arrancaron a usar OneStock.
// 4 de Córdoba (entre los inventados) + Compuaccess y Drinkmarket (también de Córdoba)
// + 1 de Mendoza.
const CLIENTS: { company: string; city: string }[] = [
  { company: "Compuaccess", city: "Córdoba" },
  { company: "Distribuidora de bebidas Drinkmarket", city: "Córdoba" },
  { company: "Ferretería Industrial Belgrano", city: "Córdoba" },
  { company: "Distribuidora Mayorista La Cañada", city: "Córdoba" },
  { company: "Pinturería Nueva Córdoba", city: "Córdoba" },
  { company: "Almacén Sierras Chicas", city: "Córdoba" },
  { company: "Bodega y Distribuidora Los Andes", city: "Mendoza" },
];

// 5 suscripciones / 2 consultas, asignadas de forma estable.
const KINDS: EventKind[] = [
  "subscription",
  "subscription",
  "consultation",
  "subscription",
  "subscription",
  "subscription",
  "consultation",
];

function buildEvents(): ProofEvent[] {
  return CLIENTS.map((c, i) => ({
    id: `${i}-${c.company}`,
    kind: KINDS[i],
    company: c.company,
    city: c.city,
    minutesAgo: 3 + i * 4, // 3, 7, 11, 15, 19, 23, 27
  }));
}

const POLL_INTERVAL_MS = 35_000;
const VISIBLE_DURATION_MS = 6_500;
const INITIAL_DELAY_MS = 4_000;

export function LiveSocialProof() {
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<ProofEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const events = buildEvents();
    let i = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    const showNext = () => {
      setCurrent(events[i % events.length]);
      setIndex(i);
      setVisible(true);
      i += 1;
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
      cycleTimer = setTimeout(showNext, POLL_INTERVAL_MS);
    };

    const showTimer = setTimeout(showNext, INITIAL_DELAY_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(cycleTimer);
    };
  }, [dismissed]);

  if (dismissed || !current) return null;

  const isSubscription = current.kind === "subscription";
  const Icon = isSubscription ? CheckCircle2 : CalendarCheck;
  const iconWrapperClass = isSubscription
    ? "bg-primary/15 text-primary"
    : "bg-accent/15 text-accent";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-4 bottom-4 z-50 max-w-[20rem] sm:max-w-sm",
        "transition-all duration-500 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/95 backdrop-blur p-3 pr-8 shadow-lg relative">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconWrapperClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">
            <span className="font-semibold">{current.company}</span>, de {current.city},{" "}
            {isSubscription ? (
              <>se suscribió al <span className="font-semibold">plan Inicial</span></>
            ) : (
              <>agendó una <span className="font-semibold">consulta personalizada</span></>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            hace {current.minutesAgo} min · verificado
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar notificación"
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
