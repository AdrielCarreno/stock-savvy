import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Plug,
  Settings,
  Truck,
  Shield,
  FileBarChart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "react-router-dom";

type NavItem = { title: string; url: string; icon: typeof Package };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Operación",
    items: [
      { title: "Caja (POS)", url: "/app/pos", icon: ShoppingCart },
      { title: "Stock y Movimientos", url: "/app/movements", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Productos", url: "/app/products", icon: Package },
      { title: "Alertas de Stock", url: "/app/low-stock", icon: AlertTriangle },
    ],
  },
  {
    label: "Personas",
    items: [
      { title: "Proveedores", url: "/app/suppliers", icon: Truck },
      { title: "Usuarios y Permisos", url: "/app/users", icon: Shield },
    ],
  },
  {
    label: "Análisis",
    items: [
      { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
      { title: "Reportes", url: "/app/reports", icon: FileBarChart },
    ],
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

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) =>
    setClosedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside
      className={`relative hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      <div className={`flex h-[72px] items-center border-b border-sidebar-border px-3 ${collapsed ? "justify-center" : "gap-3 px-5"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
          <Package className="h-4 w-4" />
        </div>
        {!collapsed && <span className="font-display text-xl font-normal text-sidebar-accent-foreground">OneStock</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 pt-3">
        {navGroups.map((group) => {
          const hasActive = group.items.some((i) => pathname.startsWith(i.url));
          const open = collapsed || !closedGroups[group.label] || hasActive;
          return (
            <div key={group.label} className="mb-3">
              {!collapsed && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleGroup(group.label)}
                  className="h-7 w-full justify-between px-2.5 text-[10px] font-semibold uppercase text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
                </Button>
              )}
              {open && (
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      title={item.title}
                      className={`flex min-h-10 items-center gap-3 rounded-sm border-l-2 border-transparent px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : ""}`}
                      activeClassName="border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-card text-muted-foreground shadow-none hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <div className={`border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">A</div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">A</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">Admin</p>
              <p className="truncate text-xs text-sidebar-foreground">Mi Empresa</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
