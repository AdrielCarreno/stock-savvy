import { Bell, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-5 w-px bg-border" />
        <Link to="/login">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
