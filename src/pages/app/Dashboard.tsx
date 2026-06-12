import { useEffect, useMemo, useState } from "react";
import { Package, TrendingDown, DollarSign, ArrowLeftRight, AlertTriangle, ArrowRight, Ship, Plane, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StockChart } from "@/components/dashboard/StockChart";
import { ClientsChart } from "@/components/dashboard/ClientsChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "cotizacion", label: "Cotización" },
  { key: "compra", label: "Compra" },
  { key: "embarque", label: "Embarque" },
  { key: "aduana", label: "Aduana" },
  { key: "entregada", label: "Entregada" },
];

export default function Dashboard() {
  const { products } = useProducts();
  const { movements } = useStockMovements();
  const { company } = useAuth();
  const [imports, setImports] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [customs, setCustoms] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "imports" | "stock" | "movements">("all");

  useEffect(() => {
    (async () => {
      const [{ data: i }, { data: s }, { data: c }] = await Promise.all([
        supabase.from("imports" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("shipments" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("customs_declarations" as any).select("*").order("created_at", { ascending: false }),
      ]);
      setImports((i as any) || []);
      setShipments((s as any) || []);
      setCustoms((c as any) || []);
    })();
  }, []);

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.current_stock <= p.min_stock && p.min_stock > 0);
    const inventoryValue = products.reduce((acc, p) => acc + (p.cost ?? 0) * p.current_stock, 0);
    const totalStock = products.reduce((acc, p) => acc + p.current_stock, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let entries7 = 0, exits7 = 0;
    movements.forEach((m) => {
      if (new Date(m.created_at) >= sevenDaysAgo) {
        if (m.type === "entrada") entries7++; else exits7++;
      }
    });
    return {
      lowStock, inventoryValue, totalStock, entries7, exits7,
      activeImports: imports.filter(i => i.status !== "finalizada").length,
      inTransit: shipments.filter(s => s.status === "en_transito" || s.status === "embarcado").length,
      inCustoms: customs.filter(c => c.status === "pendiente" || c.status === "en_revision").length,
    };
  }, [products, movements, imports, shipments, customs]);

  const trialDaysLeft = useMemo(() => {
    if (!company?.trial_end || company.subscription_status !== "trial") return null;
    return Math.max(0, Math.ceil((new Date(company.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [company]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const upcomingShipments = shipments.filter(s => s.eta && new Date(s.eta) >= new Date(Date.now() - 24 * 60 * 60 * 1000) && s.status !== "llegado")
    .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime()).slice(0, 5);
  const activeImports = imports.filter(i => i.status !== "finalizada").slice(0, 5);
  const recentImports = imports.slice(0, 5);

  const show = (s: string) => filter === "all" || filter === s;

  return (
    <div className="space-y-6 animate-fade-in">
      {trialDaysLeft !== null && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-sm font-medium text-primary">
              Período de prueba: <span className="font-semibold">{trialDaysLeft} {trialDaysLeft === 1 ? "día restante" : "días restantes"}</span>
            </p>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto gradient-primary shadow-primary text-primary-foreground">
            <a href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=a6a2ae80190846abb41a393568f6eab3" target="_blank" rel="noopener noreferrer">Activar plan</a>
          </Button>
        </div>
      )}

      <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
        <TabsList>
          <TabsTrigger value="all">Ver todo</TabsTrigger>
          <TabsTrigger value="imports">Importaciones</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>
      </Tabs>

      {(show("imports")) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Importaciones activas" value={stats.activeImports} subtitle="En proceso" icon={Ship} variant="primary" />
          <MetricCard title="Embarques en tránsito" value={stats.inTransit} subtitle="En camino" icon={Plane} variant="default" />
          <MetricCard title="Mercadería en aduana" value={stats.inCustoms} subtitle="Pendiente de liberación" icon={FileText} variant="warning" />
        </div>
      )}

      {(show("stock") || show("movements")) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {show("stock") && <MetricCard title="Productos" value={products.length} subtitle="Total registrado" icon={Package} variant="primary" />}
          {show("stock") && <MetricCard title="Stock total" value={stats.totalStock} subtitle="Unidades en depósito" icon={Package} variant="default" />}
          {show("stock") && <MetricCard title="Bajo stock" value={stats.lowStock.length} subtitle={stats.lowStock.length === 0 ? "Todo en orden" : "Requieren atención"} icon={TrendingDown} variant="warning" />}
          {show("stock") && <MetricCard title="Valor inventario" value={formatCurrency(stats.inventoryValue)} subtitle="A precio costo" icon={DollarSign} variant="success" />}
          {show("movements") && <MetricCard title="Movimientos (7d)" value={stats.entries7 + stats.exits7} subtitle={`${stats.entries7} entradas · ${stats.exits7} salidas`} icon={ArrowLeftRight} variant="default" />}
        </div>
      )}

      {show("imports") && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold">Timeline de importaciones activas</h3>
              <Link to="/app/imports"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><ArrowRight className="h-3 w-3" /></Button></Link>
            </div>
            <div className="divide-y divide-border">
              {activeImports.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin importaciones activas.</div>
              ) : activeImports.map(r => {
                const idx = STAGES.findIndex(s => s.key === r.stage);
                return (
                  <div key={r.id} className="px-5 py-3 space-y-2">
                    <div className="flex justify-between text-sm"><span className="font-medium">{r.code}</span><span className="text-muted-foreground">{r.origin_country || "-"}</span></div>
                    <div className="flex items-center">
                      {STAGES.map((s, i) => (
                        <div key={s.key} className="flex-1 flex items-center">
                          <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", i <= idx ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            {i <= idx && <Check className="h-3 w-3" />}
                          </div>
                          {i < STAGES.length - 1 && <div className={cn("h-0.5 flex-1", i < idx ? "bg-primary" : "bg-muted")} />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold">Próximos embarques</h3>
              <Link to="/app/shipments"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><ArrowRight className="h-3 w-3" /></Button></Link>
            </div>
            <div className="divide-y divide-border">
              {upcomingShipments.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin embarques próximos.</div>
              ) : upcomingShipments.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.tracking_number || s.carrier || "Embarque"}</p>
                    <p className="text-xs text-muted-foreground">{s.transport_mode} · {s.status}</p>
                  </div>
                  <div className="text-right"><p className="text-sm font-bold text-primary">{s.eta}</p><p className="text-xs text-muted-foreground">ETA</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {show("stock") && (
          <div className="xl:col-span-2"><StockChart /></div>
        )}
        {show("stock") && (
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold">Alertas de stock</h3>
                <Badge className="bg-warning-light text-warning border-warning/20 text-xs">{stats.lowStock.length}</Badge>
              </div>
              <Link to="/app/low-stock"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">Ver todos<ArrowRight className="h-3 w-3" /></Button></Link>
            </div>
            <div className="divide-y divide-border">
              {stats.lowStock.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay productos en bajo stock</div>
              ) : stats.lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}</p></div>
                  <div className="ml-3 text-right"><p className="text-sm font-bold text-warning">{p.current_stock}</p><p className="text-xs text-muted-foreground">mín. {p.min_stock}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {show("imports") && (
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">Últimas importaciones creadas</h3>
            <Link to="/app/imports"><Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="divide-y divide-border">
            {recentImports.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sin importaciones registradas.</div>
            ) : recentImports.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div><p className="text-sm font-medium">{r.code}</p><p className="text-xs text-muted-foreground">{r.origin_country || "-"} · {r.stage}</p></div>
                <div className="text-right"><p className="text-sm font-bold">US$ {Number(r.fob_usd).toLocaleString()}</p><p className="text-xs text-muted-foreground">{r.status}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {show("movements") && (
        <div className="grid grid-cols-1 gap-6"><ClientsChart /></div>
      )}
    </div>
  );
}
