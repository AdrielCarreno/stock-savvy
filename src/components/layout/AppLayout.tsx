import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TrialExpiredScreen } from "@/components/auth/TrialExpiredScreen";

const pageTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/products": "Productos",
  "/app/low-stock": "Alertas de Stock",
  "/app/suppliers": "Proveedores",
  "/app/movements": "Stock y Movimientos",
  "/app/integrations": "Integraciones",
  "/app/reports": "Reportes",
  "/app/ai": "IA",
  "/app/users": "Usuarios y permisos",
  "/app/settings": "Configuración de negocio",
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
        <main
          className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {isTrialExpired ? <TrialExpiredScreen /> : <Outlet />}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
