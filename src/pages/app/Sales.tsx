import { useEffect, useState } from "react";
import { Plus, Loader2, Receipt, Trash2 } from "lucide-react";
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

type Sale = { id: string; reference: string | null; channel: string | null; status: string; sale_date: string; discount: number; total: number; customer_id: string | null; customer_name?: string; product_name?: string; quantity?: number };

export default function Sales() {
  const { company } = useAuth();
  const { products, refresh: refreshProducts } = useProducts();
  const { createMovement } = useStockMovements();
  const [rows, setRows] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ customer_id: "", product_id: "", channel: "local", reference: "", quantity: 1, unit_price: 0, discount: 0 });

  const load = async () => {
    setLoading(true);
    const [{ data: sales }, { data: items }, { data: custs }] = await Promise.all([
      supabase.from("sales").select("*, customers(name)").order("created_at", { ascending: false }),
      supabase.from("sale_items").select("*, products(name)"),
      supabase.from("customers").select("id, name").order("name"),
    ]);
    const byId = new Map<string, any>();
    (items ?? []).forEach((it: any) => byId.set(it.sale_id, it));
    setRows((sales ?? []).map((s: any) => {
      const it = byId.get(s.id);
      return { ...s, customer_name: s.customers?.name, product_name: it?.products?.name, quantity: it?.quantity };
    }));
    setCustomers(custs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const submit = async () => {
    if (!company?.id) return;
    if (!form.product_id) return toast({ title: "Seleccioná un producto", variant: "destructive" });
    const qty = Number(form.quantity) || 0;
    const unit = Number(form.unit_price) || 0;
    const disc = Number(form.discount) || 0;
    const subtotal = qty * unit;
    const total = Math.max(0, subtotal - disc);

    // Register stock movement first (validates stock)
    const res = await createMovement({ product_id: form.product_id, type: "salida", quantity: qty, reason: `Venta ${form.reference || ""}`.trim(), sale_type: "minorista" });
    if (res.error) return;

    const { data: sale, error } = await supabase.from("sales").insert({
      company_id: company.id, customer_id: form.customer_id || null, reference: form.reference || null, channel: form.channel, discount: disc, total,
    }).select().single();
    if (error || !sale) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    await supabase.from("sale_items").insert({
      company_id: company.id, sale_id: sale.id, product_id: form.product_id, quantity: qty, unit_price: unit, subtotal,
    });
    toast({ title: "Venta registrada" });
    setOpen(false); setForm({ customer_id: "", product_id: "", channel: "local", reference: "", quantity: 1, unit_price: 0, discount: 0 });
    refreshProducts(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar venta? (No revierte stock)")) return;
    await supabase.from("sales").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Ventas</h2>
          <p className="text-sm text-muted-foreground">Registro de ventas con salida automática de inventario</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nueva venta</Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div> : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Aún no cargaste ventas.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ref</TableHead><TableHead>Cliente</TableHead><TableHead>Producto</TableHead>
              <TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Desc.</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Canal</TableHead><TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.reference ?? s.id.slice(0, 6)}</TableCell>
                  <TableCell>{s.customer_name ?? "-"}</TableCell>
                  <TableCell>{s.product_name ?? "-"}</TableCell>
                  <TableCell className="text-right">{s.quantity ?? "-"}</TableCell>
                  <TableCell className="text-right">{fmt(Number(s.discount))}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(Number(s.total))}</TableCell>
                  <TableCell><Badge variant="outline">{s.channel ?? "-"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.sale_date}</TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva venta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Referencia</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="V-0001" /></div>
              <div><Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="mercadolibre">Mercado Libre</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Cliente</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Consumidor final" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Producto *</Label>
              <Select value={form.product_id} onValueChange={(v) => {
                const p: any = products.find((x) => x.id === v);
                setForm({ ...form, product_id: v, unit_price: p?.price_retail ?? p?.price ?? 0 });
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} · Stock: {p.current_stock}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cantidad</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><Label>Precio unit.</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
              <div><Label>Descuento</Label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmt(Math.max(0, Number(form.quantity || 0) * Number(form.unit_price || 0) - Number(form.discount || 0)))}</span></p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>Registrar venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
