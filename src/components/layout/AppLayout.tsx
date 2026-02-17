import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/products": "Productos",
  "/app/movements": "Movimientos de Stock",
  "/app/low-stock": "Alertas de Bajo Stock",
};

export function AppLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Stockly";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
