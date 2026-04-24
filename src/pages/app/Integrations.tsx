import { useState } from "react";
import { Plug, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoMercadoLibre from "@/assets/logo-mercadolibre.png";
import logoTiendaNube from "@/assets/logo-tiendanube.png";
import logoShopify from "@/assets/logo-shopify.png";

interface EcommercePlatform {
  id: string;
  name: string;
  description: string;
  logo: string;
  bgColor: string;
}

const platforms: EcommercePlatform[] = [
  {
    id: "mercadolibre",
    name: "Mercado Libre",
    description: "Sincronizá tu inventario y publicaciones con el marketplace más grande de Latinoamérica.",
    logo: logoMercadoLibre,
    bgColor: "bg-[#FFE600]",
  },
  {
    id: "tiendanube",
    name: "Tienda Nube",
    description: "Conectá tu tienda online y mantené el stock unificado en tiempo real.",
    logo: logoTiendaNube,
    bgColor: "bg-[#1E5FCE]",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Integrá tu tienda Shopify para gestionar productos, pedidos y stock desde OneStock.",
    logo: logoShopify,
    bgColor: "bg-white dark:bg-white",
  },
];

export default function Integrations() {
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
          const isConnected = connected.has(platform.id);
          return (
            <div
              key={platform.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-border ${platform.bgColor}`}>
                  <img
                    src={platform.logo}
                    alt={`Logo de ${platform.name}`}
                    className="h-full w-full object-contain p-1"
                    loading="lazy"
                  />
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
