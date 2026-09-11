import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PosRegister } from "@/components/pos/PosRegister";
import { PosHistory, usePosSales } from "@/components/pos/PosHistory";
import { PAYMENT_METHODS, payLabel, fmtARS } from "@/hooks/usePos";

export default function POS() {
  const { rows, loading, reload } = usePosSales();
  const [tab, setTab] = useState("caja");

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = useMemo(
    () => rows.filter((r) => r.status !== "anulada" && r.created_at.slice(0, 10) === today),
    [rows, today]
  );

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of todayRows) {
      const pays = r.payments?.length ? r.payments : [{ method: r.payment_method ?? "efectivo", amount: Number(r.total) }];
      for (const p of pays) map.set(p.method, (map.get(p.method) ?? 0) + Number(p.amount || 0));
    }
    return PAYMENT_METHODS.map((m) => ({ method: m.value, total: map.get(m.value) ?? 0 })).filter((x) => x.total > 0);
  }, [todayRows]);

  const bySeller = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of todayRows) {
      const cur = map.get(r.seller) ?? { total: 0, count: 0 };
      map.set(r.seller, { total: cur.total + Number(r.total), count: cur.count + 1 });
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [todayRows]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    for (const r of todayRows) {
      for (const it of r.items) {
        const cur = map.get(it.name) ?? { qty: 0, total: 0 };
        map.set(it.name, { qty: cur.qty + it.quantity, total: cur.total + it.quantity * it.unit_price });
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);
  }, [todayRows]);

  const totalDia = todayRows.reduce((a, r) => a + Number(r.total), 0);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
          <TabsTrigger value="caja">Caja</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="cierre">Cierre de caja</TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="mt-4">
          <PosRegister onSold={reload} />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <PosHistory rows={rows} loading={loading} reload={reload} />
        </TabsContent>

        <TabsContent value="cierre" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total del día</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmtARS(totalDia)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ventas</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{todayRows.length}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket promedio</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{fmtARS(todayRows.length ? totalDia / todayRows.length : 0)}</CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Por medio de pago</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {byMethod.length === 0 && <p className="text-muted-foreground">Sin ventas hoy.</p>}
                {byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between border-b border-border/60 pb-1">
                    <span>{payLabel(m.method)}</span>
                    <span className="font-medium">{fmtARS(m.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Por vendedor</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bySeller.length === 0 && <p className="text-muted-foreground">Sin ventas hoy.</p>}
                {bySeller.map(([seller, v]) => (
                  <div key={seller} className="flex items-center justify-between border-b border-border/60 pb-1">
                    <span className="truncate pr-2">{seller}</span>
                    <span className="font-medium whitespace-nowrap">{v.count} · {fmtARS(v.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Más vendidos hoy</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {topProducts.length === 0 && <p className="text-muted-foreground">Sin ventas hoy.</p>}
                {topProducts.map(([name, v]) => (
                  <div key={name} className="flex items-center justify-between border-b border-border/60 pb-1">
                    <span className="truncate pr-2">{name}</span>
                    <span className="font-medium whitespace-nowrap">{v.qty} u · {fmtARS(v.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
