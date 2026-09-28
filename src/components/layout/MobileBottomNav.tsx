import { LayoutDashboard, Package, ArrowLeftRight, AlertTriangle, MoreHorizontal, Truck, Shield, Plug, Settings, FileBarChart, Sparkles, LogOut, ShoppingCart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const primaryItems = [
  { title: "Inicio", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Caja", url: "/app/pos", icon: ShoppingCart },
  { title: "Productos", url: "/app/products", icon: Package },
  { title: "Stock", url: "/app/movements", icon: ArrowLeftRight },
];

const moreGroups = [
  {
    label: "Catálogo",
    items: [{ title: "Alertas de stock", url: "/app/low-stock", icon: AlertTriangle }],
  },
  {
    label: "Personas",
    items: [
      { title: "Proveedores", url: "/app/suppliers", icon: Truck },
      { title: "Usuarios y permisos", url: "/app/users", icon: Shield },
    ],
  },
  {
    label: "Análisis",
    items: [{ title: "Reportes", url: "/app/reports", icon: FileBarChart }],
  },
  {
    label: "IA",
    items: [{ title: "Asistente IA", url: "/app/ai", icon: Sparkles }],
  },
  {
    label: "Sistema",
    items: [
      { title: "Integraciones", url: "/app/integrations", icon: Plug },
      { title: "Configuración", url: "/app/settings", icon: Settings },
    ],
  },
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
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent py-2 text-[10px] font-medium text-muted-foreground transition-colors"
            activeClassName="border-primary text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-14 w-full flex-col gap-0.5 rounded-none py-2 text-[10px] font-medium text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              <span>Más</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Más opciones</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {moreGroups.map((group) => (
                <div key={group.label} className="pt-2">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Button
                      variant="ghost"
                      key={item.url}
                      onClick={() => { setOpen(false); navigate(item.url); }}
                      className="h-11 w-full justify-start gap-3 rounded-sm px-3 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </Button>
                  ))}
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-11 w-full justify-start gap-3 rounded-sm px-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
