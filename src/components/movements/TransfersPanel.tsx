import { useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProductStock } from "@/hooks/useProductStock";
import { useStockMovements } from "@/hooks/useStockMovements";

export function TransfersPanel() {
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { stock, refresh: refreshStock } = useProductStock();
  const { movements, transferStock } = useStockMovements();

  const [productId, setProductId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const warehouseName = useMemo(() => {
    const m = new Map<string, string>();
    warehouses.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouses]);

  const availability = useMemo(() => {
    if (!productId) return [];
    return stock
      .filter((s) => s.product_id === productId)
      .map((s) => ({ id: s.warehouse_id, name: warehouseName.get(s.warehouse_id) ?? "—", qty: s.quantity }));
  }, [stock, productId, warehouseName]);

  const transfers = useMemo(
    () => movements.filter((m: any) => m.reason?.toLowerCase().includes("transferencia")).slice(0, 20),
    [movements]
  );

  const submit = async () => {
    setSaving(true);
    const { error } = await transferStock({
      product_id: productId,
      from_warehouse_id: fromId,
      to_warehouse_id: toId,
      quantity: Number(qty) || 0,
      reason: reason.trim() || null,
    });
    setSaving(false);
    if (!error) {
      setQty("1");
      setReason("");
      await refreshStock();
    }
  };

  const canSubmit = productId && fromId && toId && fromId !== toId && Number(qty) > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" /> Transferencias entre depósitos
        </h2>
        <p className="text-sm text-muted-foreground">Mové stock de un depósito a otro sin alterar el total.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
        <div className="space-y-1.5">
          <Label>Producto</Label>
          <Select value={productId} onValueChange={(v) => { setProductId(v); setFromId(""); setToId(""); }}>
            <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {availability.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availability.map((a) => (
              <Badge key={a.id} variant="outline" className="gap-1 text-[11px]">
                <Warehouse className="h-3 w-3" />{a.name}: {a.qty}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Desde</Label>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger><SelectValue placeholder="Depósito origen" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Hacia</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger><SelectValue placeholder="Depósito destino" /></SelectTrigger>
              <SelectContent>
                {warehouses.filter((w) => w.id !== fromId).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reposición sucursal..." />
          </div>
        </div>

        <Button className="w-full sm:w-auto gap-2" disabled={!canSubmit || saving} onClick={submit}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
          Transferir
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Últimas transferencias</h3>
        {transfers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Todavía no registraste transferencias.
          </div>
        ) : (
          transfers.map((t: any) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-3 text-sm shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{t.product_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.reason}</p>
                </div>
                <span className="shrink-0 font-semibold">{t.quantity} u.</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(t.movement_date).toLocaleString("es-AR")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
