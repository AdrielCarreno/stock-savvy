import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TrialExpiredScreen } from "@/components/auth/TrialExpiredScreen";

const pageTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/products": "Productos",
  "/app/movements": "Movimientos de Stock",
  "/app/low-stock": "Alertas de Bajo Stock",
};

export function AppLayout() {
  const location = useLocation();
  const { isTrialExpired } = useAuth();
  const title = pageTitles[location.pathname] ?? "OneStock";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {isTrialExpired ? <TrialExpiredScreen /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
