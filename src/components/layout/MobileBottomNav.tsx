import { LayoutDashboard, Package, ArrowLeftRight, AlertTriangle, MoreHorizontal, Truck, Shield, Plug, Settings, Calculator, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const primaryItems = [
  { title: "Inicio", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Productos", url: "/app/products", icon: Package },
  { title: "Movim.", url: "/app/movements", icon: ArrowLeftRight },
  { title: "Contab.", url: "/app/accounting", icon: Calculator },
];

const moreItems = [
  { title: "Proveedores", url: "/app/suppliers", icon: Truck },
  { title: "Alertas de stock", url: "/app/low-stock", icon: AlertTriangle },
  { title: "Usuarios y permisos", url: "/app/users", icon: Shield },
  { title: "Integraciones", url: "/app/integrations", icon: Plug },
  { title: "Configuración de negocio", url: "/app/settings", icon: Settings },
];

export function MobileBottomNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {primaryItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              <span>Más</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Más opciones</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {moreItems.map((item) => (
                <button
                  key={item.url}
                  onClick={() => { setOpen(false); navigate(item.url); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  {item.title}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
