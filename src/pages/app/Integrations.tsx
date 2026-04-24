import { useState } from "react";
import { Plug, ShoppingBag, Store, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface EcommercePlatform {
  id: string;
  name: string;
  description: string;
  icon: typeof Plug;
  color: string;
}

const platforms: EcommercePlatform[] = [
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    description: "Sincronizá tu inventario y publicaciones con el marketplace más grande de Latinoamérica.",
    icon: ShoppingCart,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    id: "tiendanube",
    name: "Tienda Nube",
    description: "Conectá tu tienda online y mantené el stock unificado en tiempo real.",
    icon: Store,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Integrá tu tienda Shopify para gestionar productos, pedidos y stock desde OneStock.",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

export default function Integrations() {
  const { toast } = useToast();
  const [connected] = useState<Set<string>>(new Set());

  const handleIntegrate = (platform: EcommercePlatform) => {
    const message = encodeURIComponent(
      `Hola, soy ... y quiero integrar Onestock con ${platform.name}`
    );
    window.open(`https://wa.me/5493516516785?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary">
            <Plug className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Integraciones de E-commerce</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conectá OneStock con tus plataformas de venta online para sincronizar productos, stock y pedidos automáticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isConnected = connected.has(platform.id);
          return (
            <div
              key={platform.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                {isConnected ? (
                  <Badge className="bg-success-light text-success border-success/20">
                    <Check className="mr-1 h-3 w-3" /> Conectado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">No conectado</Badge>
                )}
              </div>

              <div className="mt-4 flex-1">
                <h3 className="text-base font-semibold text-foreground">{platform.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{platform.description}</p>
              </div>

              <Button
                onClick={() => handleIntegrate(platform)}
                className="mt-5 w-full gradient-primary shadow-primary text-primary-foreground"
                disabled={isConnected}
              >
                {isConnected ? "Integrado" : "Integrar"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Necesitás integrar otra plataforma?{" "}
          <a
            href="https://wa.me/5493516516785?text=Hola%2C%20soy%20...%20y%20quiero%20integrar%20Onestock%20con%20"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Contactanos
          </a>
        </p>
      </div>
    </div>
  );
}
