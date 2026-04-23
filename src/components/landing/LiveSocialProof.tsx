import { useEffect, useMemo, useState } from "react";
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

// Nombres de empresas ficticias (rubros variados, estilo argentino)
const COMPANIES = [
  "Compuaccess",
  "Martínez Construcciones",
  "Ferretería Mark",
  "Distribuidora La Estrella",
  "Almacén Don Pepe",
  "Pinturería El Sol",
  "Bazar Norte",
  "Librería San Martín",
  "Importadora del Plata",
  "Mayorista La Económica",
  "Repuestos García",
  "Electrodomésticos Andes",
  "Distribuidora Patagónica",
  "Comercial Río de la Plata",
  "Ferretería Industrial Sur",
  "Mayorista El Trébol",
  "Textil Buenos Aires",
  "Distribuidora Norte Grande",
  "Comercial San Lorenzo",
  "Insumos Médicos Vida",
  "Papelera Litoral",
  "Frigorífico Las Pampas",
  "Distribuidora Cuyo",
];

const CITIES = [
  "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Mar del Plata",
  "Tucumán", "Salta", "Neuquén", "Bahía Blanca", "San Juan", "Santa Fe",
  "Corrientes", "Posadas", "Resistencia", "Río Negro", "Chubut",
];

// Distribución ponderada: las suscripciones al plan Inicial son lo más frecuente
const KIND_POOL: EventKind[] = [
  "subscription", "subscription", "subscription", "subscription", "subscription",
  "consultation", "consultation",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEvent(): ProofEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: pick(KIND_POOL),
    company: pick(COMPANIES),
    city: pick(CITIES),
    minutesAgo: Math.floor(Math.random() * 28) + 1,
  };
}

const POLL_INTERVAL_MS = 35_000; // ~35s entre notificaciones
const VISIBLE_DURATION_MS = 6_500;
const INITIAL_DELAY_MS = 4_000;

export function LiveSocialProof() {
  const initialQueue = useMemo(
    () => Array.from({ length: 12 }, () => buildEvent()),
    []
  );

  const [queue, setQueue] = useState<ProofEvent[]>(initialQueue);
  const [current, setCurrent] = useState<ProofEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    const showNext = () => {
      setQueue((prev) => {
        const next = prev.length > 0 ? prev : Array.from({ length: 8 }, () => buildEvent());
        const [head, ...rest] = next;
        setCurrent(head);
        setVisible(true);

        hideTimer = setTimeout(() => setVisible(false), VISIBLE_DURATION_MS);
        cycleTimer = setTimeout(showNext, POLL_INTERVAL_MS);

        return rest;
      });
    };

    showTimer = setTimeout(showNext, INITIAL_DELAY_MS);

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
