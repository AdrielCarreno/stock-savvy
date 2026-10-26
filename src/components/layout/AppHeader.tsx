import { Bell, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallAppButton } from "@/components/InstallAppButton";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="app-header flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 md:h-[72px] md:px-8 xl:px-10">
      <div className="min-w-0 flex-1">
        <p className="hidden text-[10px] font-semibold uppercase text-muted-foreground md:block">Espacio de trabajo</p>
        <h1 className="break-words font-display text-lg font-normal leading-tight text-foreground md:text-2xl">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-0 sm:gap-2">
        <InstallAppButton />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Configuración de negocio"
          title="Configuración de negocio"
          onClick={() => navigate("/app/settings")}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <div className="mx-2 hidden h-5 w-px bg-border sm:block" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}
