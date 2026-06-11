import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, Ship, Building2, FileText } from "lucide-react";

export default function Reports() {
  const [stats, setStats] = useState({ products: 0, suppliers: 0, imports: 0, shipments: 0, customs: 0, totalFob: 0 });

  useEffect(() => {
    (async () => {
      const [p, s, i, sh, c] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("suppliers" as any).select("id", { count: "exact", head: true }),
        supabase.from("imports" as any).select("fob_usd"),
        supabase.from("shipments" as any).select("id", { count: "exact", head: true }),
        supabase.from("customs_declarations" as any).select("id", { count: "exact", head: true }),
      ]);
      const totalFob = ((i.data as any[]) || []).reduce((a, r) => a + Number(r.fob_usd || 0), 0);
      setStats({
        products: p.count || 0,
        suppliers: s.count || 0,
        imports: (i.data as any[])?.length || 0,
        shipments: sh.count || 0,
        customs: c.count || 0,
        totalFob,
      });
    })();
  }, []);

  const cards = [
    { title: "Productos", value: stats.products, icon: Package },
    { title: "Proveedores", value: stats.suppliers, icon: Building2 },
    { title: "Importaciones", value: stats.imports, icon: Ship },
    { title: "Embarques", value: stats.shipments, icon: Ship },
    { title: "Declaraciones", value: stats.customs, icon: FileText },
    { title: "FOB acumulado (USD)", value: `$${stats.totalFob.toLocaleString()}`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Indicadores y resumen de toda tu operación.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Próximamente</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Reportes avanzados: rentabilidad por importación, evolución de costos, exportación a Excel/PDF y comparativas por proveedor.
        </CardContent>
      </Card>
    </div>
  );
}
