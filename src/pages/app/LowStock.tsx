import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2, CalendarClock, PauseCircle, Save, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import type { Product } from "@/types/database";

function StockBar({ stock, min }: { stock: number; min: number }) {
  const pct = min === 0 ? 100 : Math.min(100, (stock / min) * 100);
  const color = pct <= 25 ? "bg-destructive" : pct <= 60 ? "bg-warning" : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-muted-foreground">{Math.round(pct)}%</span>
    </div>
  );
}

function StockLevelsDialog({ product, onSave }: { product: Product; onSave: (min: number, max: number, expiry: string | null) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(String(product.min_stock ?? 0));
  const [max, setMax] = useState(String(product.max_stock ?? 0));
  const [expiry, setExpiry] = useState(product.expiry_date ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSave(Number(min) || 0, Number(max) || 0, expiry || null);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
          <Save className="h-3.5 w-3.5" /> Configurar niveles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Stock mínimo</Label>
              <Input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock máximo</Label>
              <Input type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fecha de vencimiento (opcional)</Label>
            <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LowStock() {
  const { products, loading, updateProduct } = useProducts();
  const { movements } = useStockMovements();

  const handleSave = async (id: string) => async (min: number, max: number, expiry: string | null) => {
    await updateProduct(id, { min_stock: min, max_stock: max, expiry_date: expiry });
  };

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.min_stock > 0 && p.current_stock <= p.min_stock),
    [products]
  );

  const overStockProducts = useMemo(
    () => products.filter((p) => (p.max_stock ?? 0) > 0 && p.current_stock > p.max_stock),
    [products]
  );

  const expiring = useMemo(() => {
    const now = Date.now();
    const limit = now + 90 * 24 * 60 * 60 * 1000;
    return products
      .filter((p) => p.expiry_date && new Date(p.expiry_date).getTime() <= limit)
      .map((p) => ({
        ...p,
        days: Math.ceil((new Date(p.expiry_date as string).getTime() - now) / (24 * 60 * 60 * 1000)),
      }))
      .sort((a, b) => a.days - b.days);
  }, [products]);

  const stale = useMemo(() => {
    const lastMove = new Map<string, number>();
    movements.forEach((m) => {
      const t = new Date(m.movement_date).getTime();
      if (!lastMove.has(m.product_id) || t > (lastMove.get(m.product_id) as number)) lastMove.set(m.product_id, t);
    });
    const now = Date.now();
    return products
      .filter((p) => p.current_stock > 0)
      .map((p) => {
        const last = lastMove.get(p.id) ?? new Date(p.created_at).getTime();
        return { ...p, days: Math.floor((now - last) / (24 * 60 * 60 * 1000)), last };
      })
      .filter((p) => p.days >= 30)
      .sort((a, b) => b.days - a.days);
  }, [products, movements]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Alertas de Stock</h2>
          <p className="text-sm text-muted-foreground">Reposición, vencimientos y stock estancado</p>
        </div>
        <Link to="/app/movements" className="shrink-0">
          <Button className="w-full gap-2 gradient-primary text-primary-foreground shadow-primary sm:w-auto">
            <ArrowRight className="h-4 w-4" />
            Registrar entrada
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="low" className="w-full">
        <TabsList className="mb-4 flex w-full gap-1 overflow-x-auto whitespace-nowrap md:w-auto md:inline-flex">
          <TabsTrigger value="low" className="gap-1.5 px-3 text-xs md:text-sm">
            <AlertTriangle className="h-3.5 w-3.5" />Bajo stock ({lowStockProducts.length})
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-1.5 px-3 text-xs md:text-sm">
            <CalendarClock className="h-3.5 w-3.5" />Vencimientos ({expiring.length})
          </TabsTrigger>
          <TabsTrigger value="stale" className="gap-1.5 px-3 text-xs md:text-sm">
            <PauseCircle className="h-3.5 w-3.5" />Sin movimiento ({stale.length})
          </TabsTrigger>
          <TabsTrigger value="over" className="gap-1.5 px-3 text-xs md:text-sm">
            <Package className="h-3.5 w-3.5" />Sobre máximo ({overStockProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* Bajo stock */}
        <TabsContent value="low" className="mt-0 space-y-4">
          {lowStockProducts.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-light p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-semibold text-warning">
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? "producto" : "productos"} por debajo del mínimo
                </p>
                <p className="mt-1 text-xs text-warning/80">Registrá las entradas necesarias para evitar faltantes.</p>
              </div>
            </div>
          )}
          {lowStockProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Todo en orden: no hay productos por debajo del stock mínimo.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku ?? "Sin SKU"}</p>
                    </div>
                    <Badge variant={p.current_stock === 0 ? "destructive" : "secondary"} className="shrink-0 text-[10px]">
                      {p.current_stock === 0 ? "Sin stock" : "Crítico"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>Actual: <b className="text-foreground">{p.current_stock}</b></span>
                    <span>Mín: {p.min_stock}{(p.max_stock ?? 0) > 0 ? ` · Máx: ${p.max_stock}` : ""}</span>
                  </div>
                  <StockBar stock={p.current_stock} min={p.min_stock} />
                  <StockLevelsDialog product={p} onSave={await_wrapper(handleSave(p.id))} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vencimientos */}
        <TabsContent value="expiry" className="mt-0 space-y-3">
          {expiring.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No hay productos con vencimiento próximo. Cargá la fecha en cada producto para activar la alerta.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {expiring.map((p) => (
                <div key={p.id} className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                    <Badge variant={p.days < 0 ? "destructive" : p.days <= 30 ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {p.days < 0 ? "Vencido" : `${p.days} días`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vence el {new Date(p.expiry_date as string).toLocaleDateString("es-AR")} · {p.current_stock} u. en stock
                  </p>
                  <StockLevelsDialog product={p} onSave={await_wrapper(handleSave(p.id))} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sin movimiento */}
        <TabsContent value="stale" className="mt-0 space-y-3">
          {stale.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No hay productos estancados: todo el inventario tuvo movimiento en los últimos 30 días.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stale.map((p) => (
                <div key={p.id} className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{p.days} días</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.current_stock} u. inmovilizadas · último movimiento {new Date(p.last).toLocaleDateString("es-AR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sobre máximo */}
        <TabsContent value="over" className="mt-0 space-y-3">
          {overStockProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Ningún producto supera su stock máximo configurado.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {overStockProducts.map((p) => (
                <div key={p.id} className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">+{p.current_stock - p.max_stock}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.current_stock} u. · máximo {p.max_stock}</p>
                  <StockLevelsDialog product={p} onSave={await_wrapper(handleSave(p.id))} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** handleSave devuelve una promesa de función; la desenvolvemos para el diálogo. */
function await_wrapper(fn: Promise<(min: number, max: number, expiry: string | null) => Promise<void>>) {
  return async (min: number, max: number, expiry: string | null) => {
    const resolved = await fn;
    await resolved(min, max, expiry);
  };
}
