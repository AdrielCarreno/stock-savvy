import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Plug,
  Settings,
  Truck,
  Shield,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Productos", url: "/app/products", icon: Package },
  { title: "Movimientos", url: "/app/movements", icon: ArrowLeftRight },
  { title: "Contabilidad", url: "/app/accounting", icon: Calculator },
  { title: "Proveedores", url: "/app/suppliers", icon: Truck },
  { title: "Alertas de Stock", url: "/app/low-stock", icon: AlertTriangle },
  { title: "Usuarios y Permisos", url: "/app/users", icon: Shield },
  { title: "Integraciones", url: "/app/integrations", icon: Plug },
  { title: "Configuración", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className={`flex h-14 items-center border-b border-sidebar-border px-3 ${collapsed ? "justify-center" : "gap-2 px-4"}`}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Package className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && <span className="text-base font-bold text-sidebar-accent-foreground">OneStock</span>}
      </div>

      <nav className="flex-1 space-y-1 p-2 pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : ""}`}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

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
