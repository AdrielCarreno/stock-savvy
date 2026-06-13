import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanKind = "stock" | "importador";

type ProofEvent = {
  id: string;
  plan: PlanKind;
  company: string;
  city: string;
  minutesAgo: number;
};

// 3 suscripciones al plan Stock (distribuidoras / pinturería) + 2 al plan Importador
// (Compuaccess + empresa de tecnología inventada).
const EVENTS: Omit<ProofEvent, "id">[] = [
  { plan: "stock", company: "Distribuidora Mayorista La Cañada", city: "Córdoba", minutesAgo: 4 },
  { plan: "importador", company: "Compuaccess", city: "Córdoba", minutesAgo: 9 },
  { plan: "stock", company: "Pinturería Nueva Córdoba", city: "Córdoba", minutesAgo: 14 },
  { plan: "importador", company: "NorTech Solutions", city: "Buenos Aires", minutesAgo: 21 },
  { plan: "stock", company: "Distribuidora de bebidas Drinkmarket", city: "Córdoba", minutesAgo: 28 },
];

function buildEvents(): ProofEvent[] {
  return EVENTS.map((e, i) => ({ ...e, id: `${i}-${e.company}` }));
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
