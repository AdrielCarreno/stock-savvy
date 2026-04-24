import { Landmark, Clock, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoArca from "@/assets/logo-arca.webp";

export default function Arca() {

  const handleConnect = () => {
    const message = encodeURIComponent(
      "Hola, soy ... y quiero conectar Onestock con Arca"
    );
    window.open(`https://wa.me/5493516516785?text=${message}`, "_blank");
  };

  const features = [
    {
      icon: FileText,
      title: "Facturación electrónica",
      description: "Emití facturas A, B y C directamente desde OneStock con validación AFIP/ARCA.",
    },
    {
      icon: ShieldCheck,
      title: "Cumplimiento fiscal",
      description: "Mantené tu inventario y movimientos alineados con las normativas vigentes de ARCA.",
    },
    {
      icon: Landmark,
      title: "Reportes oficiales",
      description: "Generá libros de IVA y reportes contables listos para presentar.",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="gradient-primary p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img src={logoArca} alt="Logo de ARCA" className="h-full w-full object-contain" loading="lazy" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">ARCA</h2>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                    <Clock className="mr-1 h-3 w-3" /> Próximamente
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-white/80">
                  Agencia de Recaudación y Control Aduanero
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-white/90">
            Integrá OneStock con ARCA para automatizar la facturación electrónica, el control fiscal y el cumplimiento de las normativas argentinas, todo desde un solo lugar.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-semibold text-foreground">Conectar OneStock con ARCA</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Habilitá la sincronización automática de comprobantes y stock con ARCA.
              </p>
            </div>
            <Button
              onClick={handleConnect}
              className="gradient-primary shadow-primary text-primary-foreground"
            >
              <Landmark className="mr-2 h-4 w-4" />
              Conectar con ARCA
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-foreground">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">Función en desarrollo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La integración con ARCA estará disponible próximamente. Te notificaremos apenas esté lista para que puedas activarla en un solo click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
