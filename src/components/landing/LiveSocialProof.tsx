import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package, TrendingUp, Users, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type ProofType = "signup" | "import" | "movement" | "milestone" | "trial";

type ProofEvent = {
  id: string;
  type: ProofType;
  name?: string;
  city?: string;
  message: string;
  minutesAgo: number;
};

// Datos seed anonimizados (solo nombre de pila + ciudad/provincia)
const FIRST_NAMES = [
  "Juan", "María", "Lucas", "Sofía", "Martín", "Camila", "Diego", "Valentina",
  "Mateo", "Florencia", "Nicolás", "Agustina", "Tomás", "Julieta", "Federico",
  "Carolina", "Ramiro", "Antonella", "Joaquín", "Micaela",
];

const CITIES = [
  "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Mar del Plata",
  "Tucumán", "Salta", "Neuquén", "Bahía Blanca", "San Juan", "Santa Fe",
  "Corrientes", "Posadas", "Resistencia",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildEvent(): ProofEvent {
  const types: ProofType[] = ["signup", "import", "movement", "milestone", "trial"];
  const type = pick(types);
  const name = pick(FIRST_NAMES);
  const city = pick(CITIES);
  const minutesAgo = Math.floor(Math.random() * 28) + 1;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (type) {
    case "signup":
      return {
        id, type, name, city, minutesAgo,
        message: `${name} de ${city} acaba de crear su cuenta`,
      };
    case "import": {
      const qty = [45, 80, 120, 200, 350][Math.floor(Math.random() * 5)];
      return {
        id, type, city, minutesAgo,
        message: `Una empresa de ${city} importó ${qty} productos`,
      };
    }
    case "movement": {
      const qty = [12, 25, 40, 60, 85][Math.floor(Math.random() * 5)];
      return {
        id, type, city, minutesAgo,
        message: `Se registraron ${qty} movimientos de stock en ${city}`,
      };
    }
    case "milestone": {
      const total = [250, 320, 410, 500][Math.floor(Math.random() * 4)];
      return {
        id, type, minutesAgo,
        message: `+${total} empresas ya gestionan su stock con OneStock`,
      };
    }
    case "trial":
      return {
        id, type, name, city, minutesAgo,
        message: `${name} comenzó su prueba gratuita de 14 días`,
      };
  }
}

const ICONS: Record<ProofType, typeof CheckCircle2> = {
  signup: CheckCircle2,
  import: Package,
  movement: ShoppingCart,
  milestone: Users,
  trial: TrendingUp,
};

const ICON_COLORS: Record<ProofType, string> = {
  signup: "bg-emerald-500/15 text-emerald-500",
  import: "bg-blue-500/15 text-blue-500",
  movement: "bg-amber-500/15 text-amber-500",
  milestone: "bg-primary/15 text-primary",
  trial: "bg-violet-500/15 text-violet-500",
};

const POLL_INTERVAL_MS = 35_000; // ~35s entre notificaciones
const VISIBLE_DURATION_MS = 6_500;
const INITIAL_DELAY_MS = 4_000;

export function LiveSocialProof() {
  // Cola pre-cargada para que aparezcan eventos variados sin esperar
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

  const Icon = ICONS[current.type];

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
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ICON_COLORS[current.type])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground leading-snug">
            {current.message}
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
