import { useEffect, useState } from "react";
import { Moon, Sun, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "warm";
const KEY = "onestock-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "warm");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "warm") root.classList.add("warm");
}

export function initTheme() {
  const t = (localStorage.getItem(KEY) as Theme) || "light";
  apply(t);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(KEY) as Theme) || "light");

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const next: Record<Theme, Theme> = { light: "dark", dark: "warm", warm: "light" };
  const Icon = theme === "dark" ? Moon : theme === "warm" ? Flame : Sun;
  const label = theme === "dark" ? "Oscuro" : theme === "warm" ? "Cálido" : "Claro";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next[theme])}
      aria-label={`Cambiar tema (actual: ${label})`}
      title={`Tema: ${label}`}
      className="gap-2"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline text-xs">{label}</span>
    </Button>
  );
}
