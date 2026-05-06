import { Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Shown inside the app when trial has expired.
 * User remains logged in but cannot access modules.
 */
export function TrialExpiredScreen() {
  const { signOut, company } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-6 rounded-xl border border-amber-200 bg-amber-50/80 p-8 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Mail className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Tu período de prueba ha finalizado
          </h2>
          <p className="text-sm text-muted-foreground">
            {company?.name
              ? `Para seguir usando OneStock con "${company.name}" necesitás activar tu suscripción.`
              : "Contactanos para activar tu suscripción."}
          </p>
          <p className="text-sm font-medium text-foreground">
            Contactanos para activar tu suscripción.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            asChild
            variant="default"
            className="gradient-primary shadow-primary text-primary-foreground"
          >
            <a
              href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3"
              target="_blank"
              rel="noopener noreferrer"
            >
              Suscribirse al plan
            </a>
          </Button>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
