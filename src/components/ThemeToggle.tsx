import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
const KEY = "onestock-theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "warm");
  if (theme === "dark") root.classList.add("dark");
}

export function initTheme() {
  let t = (localStorage.getItem(KEY) as Theme | "warm") || "light";
  if (t === "warm") t = "light";
  apply(t);
  if (t !== localStorage.getItem(KEY)) localStorage.setItem(KEY, t);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    let t = (localStorage.getItem(KEY) as Theme | "warm") || "light";
    if (t === "warm") t = "light";
    return t;
  });

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const next: Record<Theme, Theme> = { light: "dark", dark: "light" };
  const Icon = theme === "dark" ? Moon : Sun;
  const label = theme === "dark" ? "Oscuro" : "Claro";

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
