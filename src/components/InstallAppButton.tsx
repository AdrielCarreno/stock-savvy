import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandaloneDisplay } from "@/lib/standalone";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * "Instalar app" button for the authenticated workspace only.
 * Uses the browser's install prompt; hidden on the landing and once the app
 * is already installed (standalone display).
 */
export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneDisplay());

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !installEvent) return null;

  const handleClick = async () => {
    setInstallEvent(null);
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Instalar app"
      title="Instalar OneStock en tu dispositivo"
      onClick={handleClick}
    >
      <Smartphone className="h-4 w-4" />
      <span className="hidden sm:inline">Instalar app</span>
    </Button>
  );
}
