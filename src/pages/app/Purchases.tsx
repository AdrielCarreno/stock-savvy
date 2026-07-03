import { useEffect, useState } from "react";
import { Plus, Loader2, ShoppingCart, PackageCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type Purchase = { id: string; reference: string | null; status: string; order_date: string; received_date: string | null; total: number; supplier_id: string | null; product_id: string | null; quantity: number; unit_cost: number; supplier_name?: string; product_name?: string };

export default function Purchases() {
  const { company } = useAuth();
  const { products, refresh: refreshProducts } = useProducts();
  const { createMovement } = useStockMovements();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ supplier_id: "", product_id: "", reference: "", quantity: 1, unit_cost: 0 });

  const load = async () => {
    setLoading(true);
    const [{ data: purchases }, { data: items }, { data: sups }] = await Promise.all([
      supabase.from("purchases").select("*, suppliers(name)").order("created_at", { ascending: false }),
      supabase.from("purchase_items").select("*, products(name)"),
      supabase.from("suppliers").select("id, name").order("name"),
    ]);
    const itemsByPurchase = new Map<string, any>();
    (items ?? []).forEach((it: any) => itemsByPurchase.set(it.purchase_id, it));
    const merged = (purchases ?? []).map((p: any) => {
      const it = itemsByPurchase.get(p.id);
      return { ...p, supplier_name: p.suppliers?.name, product_id: it?.product_id ?? null, product_name: it?.products?.name ?? null, quantity: it?.quantity ?? 0, unit_cost: it?.unit_cost ?? 0 };
    });
    setRows(merged);
    setSuppliers(sups ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const submit = async () => {
    if (!company?.id) return;
    if (!form.product_id) return toast({ title: "Seleccioná un producto", variant: "destructive" });
    const qty = Number(form.quantity) || 0;
    const cost = Number(form.unit_cost) || 0;
    const total = qty * cost;
    const { data: purchase, error } = await supabase.from("purchases").insert({
      company_id: company.id, supplier_id: form.supplier_id || null, reference: form.reference || null, total,
    }).select().single();
    if (error || !purchase) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    const { error: iErr } = await supabase.from("purchase_items").insert({
      company_id: company.id, purchase_id: purchase.id, product_id: form.product_id, quantity: qty, unit_cost: cost, subtotal: total,
    });
    if (iErr) return toast({ title: "Error", description: friendlyError(iErr), variant: "destructive" });
    toast({ title: "Orden de compra creada" });
    setOpen(false); setForm({ supplier_id: "", product_id: "", reference: "", quantity: 1, unit_cost: 0 });
    load();
  };

  const receive = async (p: Purchase) => {
    if (!p.product_id || !p.quantity) return toast({ title: "Falta información de producto", variant: "destructive" });
    const res = await createMovement({ product_id: p.product_id, type: "entrada", quantity: p.quantity, reason: `Compra ${p.reference ?? p.id.slice(0, 6)}` });
    if (res.error) return;
    await supabase.from("purchases").update({ status: "recibida", received_date: new Date().toISOString().slice(0, 10) }).eq("id", p.id);
    refreshProducts(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar orden?")) return;
    await supabase.from("purchases").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Compras</h2>
          <p className="text-sm text-muted-foreground">Órdenes de compra y recepción de mercadería</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nueva compra</Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Aún no cargaste órdenes de compra.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ref</TableHead><TableHead>Proveedor</TableHead><TableHead>Producto</TableHead>
              <TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.reference ?? p.id.slice(0, 6)}</TableCell>
                  <TableCell>{p.supplier_name ?? "-"}</TableCell>
                  <TableCell>{p.product_name ?? "-"}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(Number(p.total))}</TableCell>
                  <TableCell><Badge variant={p.status === "recibida" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.order_date}</TableCell>
                  <TableCell className="text-right">
                    {p.status !== "recibida" && <Button size="sm" variant="outline" className="gap-1" onClick={() => receive(p)}><PackageCheck className="h-3 w-3" />Recibir</Button>}
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva orden de compra</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Referencia</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="OC-0001" /></div>
            <div><Label>Proveedor</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Producto *</Label>
              <Select value={form.product_id} onValueChange={(v) => {
                const p = products.find((x) => x.id === v);
                setForm({ ...form, product_id: v, unit_cost: p?.cost ?? 0 });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cantidad</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label>Costo unitario</Label><Input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Total estimado: <span className="font-semibold text-foreground">{fmt(Number(form.quantity || 0) * Number(form.unit_cost || 0))}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
