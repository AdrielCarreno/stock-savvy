import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Receipt, Trash2, Search, Filter, FileDown, X, Truck } from "lucide-react";
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

type SaleItem = { product_id: string; quantity: number; unit_price: number; product_name?: string; product_sku?: string };
type Sale = { id: string; reference: string | null; channel: string | null; status: string; sale_date: string; discount: number; total: number; customer_id: string | null; payment_method: string | null; logistics: string | null; invoice_url: string | null; invoice_number: string | null; customer_name?: string; items: SaleItem[] };

const PAYMENTS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tc", label: "Tarjeta de crédito" },
  { value: "td", label: "Tarjeta de débito" },
  { value: "transf", label: "Transferencia" },
  { value: "qr", label: "QR" },
];

const emptyForm = () => ({
  customer_id: "",
  channel: "local",
  reference: "",
  payment_method: "efectivo",
  logistics: "",
  invoice_number: "",
  invoice_url: "",
  discount: 0,
  items: [{ product_id: "", quantity: 1, unit_price: 0 }] as SaleItem[],
});

export default function Sales() {
  const { company } = useAuth();
  const { products, refresh: refreshProducts } = useProducts();
  const { createMovement } = useStockMovements();
  const [rows, setRows] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm());
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const [{ data: sales }, { data: items }, { data: custs }] = await Promise.all([
      supabase.from("sales").select("*, customers(name)").order("created_at", { ascending: false }),
      supabase.from("sale_items").select("*, products(name, sku)"),
      supabase.from("customers").select("id, name").order("name"),
    ]);
    const byId = new Map<string, SaleItem[]>();
    (items ?? []).forEach((it: any) => {
      const arr = byId.get(it.sale_id) ?? [];
      arr.push({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price, product_name: it.products?.name, product_sku: it.products?.sku });
      byId.set(it.sale_id, arr);
    });
    setRows((sales ?? []).map((s: any) => ({ ...s, customer_name: s.customers?.name, items: byId.get(s.id) ?? [] })));
    setCustomers(custs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const filtered = useMemo(() => rows.filter((s) => {
    if (channelFilter !== "all" && s.channel !== channelFilter) return false;
    if (payFilter !== "all" && s.payment_method !== payFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const inItems = s.items.some((it) => it.product_name?.toLowerCase().includes(q) || it.product_sku?.toLowerCase().includes(q));
      return s.reference?.toLowerCase().includes(q) || s.customer_name?.toLowerCase().includes(q) || s.invoice_number?.toLowerCase().includes(q) || inItems;
    }
    return true;
  }), [rows, search, channelFilter, payFilter]);

  const itemsTotal = useMemo(() => (form.items as SaleItem[]).reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0), [form.items]);
  const grandTotal = Math.max(0, itemsTotal - Number(form.discount || 0));

  const updateItem = (idx: number, patch: Partial<SaleItem>) => {
    const next = [...form.items];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, items: next });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", quantity: 1, unit_price: 0 }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_: any, i: number) => i !== idx) });

  const submit = async () => {
    if (!company?.id) return;
    const items: SaleItem[] = form.items.filter((it: SaleItem) => it.product_id && Number(it.quantity) > 0);
    if (items.length === 0) return toast({ title: "Agregá al menos un producto", variant: "destructive" });
    const rawUrl = (form.invoice_url || "").trim();
    if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
      return toast({ title: "URL de factura inválida", description: "Debe comenzar con http:// o https://", variant: "destructive" });
    }

    // Register stock movements (validates stock) for each item
    for (const it of items) {
      const res = await createMovement({ product_id: it.product_id, type: "salida", quantity: Number(it.quantity), reason: `Venta ${form.reference || ""}`.trim(), sale_type: form.channel === "mayorista" ? "mayorista" : "minorista", logistics: form.logistics || null });
      if (res.error) return;
    }

    const { data: sale, error } = await supabase.from("sales").insert({
      company_id: company.id,
      customer_id: form.customer_id || null,
      reference: form.reference || null,
      channel: form.channel,
      discount: Number(form.discount) || 0,
      total: grandTotal,
      payment_method: form.payment_method || null,
      logistics: form.logistics || null,
      invoice_number: form.invoice_number || null,
      invoice_url: rawUrl || null,
    } as any).select().single();
    if (error || !sale) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });

    const rows = items.map((it) => ({
      company_id: company.id, sale_id: sale.id, product_id: it.product_id,
      quantity: Number(it.quantity), unit_price: Number(it.unit_price), subtotal: Number(it.quantity) * Number(it.unit_price),
    }));
    await supabase.from("sale_items").insert(rows);
    toast({ title: "Venta registrada" });
    setOpen(false); setForm(emptyForm());
    refreshProducts(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar venta? (No revierte stock)")) return;
    await supabase.from("sales").delete().eq("id", id);
    load();
  };

  const payLabel = (v: string | null) => PAYMENTS.find((p) => p.value === v)?.label ?? "-";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Ventas</h2>
          <p className="text-sm text-muted-foreground">Registro de ventas con salida automática de inventario</p>
        </div>
        <Button onClick={() => { setForm(emptyForm()); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Nueva venta</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por referencia, cliente, factura o producto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filtros:</div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="mercadolibre">Mercado Libre</SelectItem>
              <SelectItem value="mayorista">Mayorista</SelectItem>
            </SelectContent>
          </Select>
          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Medio de pago" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pagos</SelectItem>
              {PAYMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Aún no cargaste ventas." : "No hay ventas con esos filtros."}</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Ref</TableHead><TableHead>Cliente</TableHead><TableHead>Productos</TableHead>
              <TableHead>Medio de pago</TableHead><TableHead>Logística</TableHead><TableHead>Factura</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead>Canal</TableHead><TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.reference ?? s.id.slice(0, 6)}</TableCell>
                  <TableCell>{s.customer_name ?? "Consumidor final"}</TableCell>
                  <TableCell className="max-w-[240px]">
                    {s.items.length === 0 ? "-" : (
                      <div className="space-y-0.5 text-xs">
                        {s.items.slice(0, 3).map((it, i) => (
                          <div key={i} className="truncate"><span className="font-medium">{it.quantity}×</span> {it.product_name ?? "—"}</div>
                        ))}
                        {s.items.length > 3 && <div className="text-muted-foreground">+{s.items.length - 3} más</div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="uppercase text-xs">{payLabel(s.payment_method)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.logistics ? <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{s.logistics}</span> : "-"}</TableCell>
                  <TableCell>
                    {s.invoice_url ? (
                      <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                        <a href={s.invoice_url} target="_blank" rel="noopener noreferrer"><FileDown className="h-3 w-3" />{s.invoice_number ?? "Descargar"}</a>
                      </Button>
                    ) : s.invoice_number ? (
                      <span className="text-xs text-muted-foreground">{s.invoice_number}</span>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Consumidor final" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Medio de pago</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {(form.channel === "online" || form.channel === "mercadolibre") && (
              <div><Label>Logística</Label><Input value={form.logistics} onChange={(e) => setForm({ ...form, logistics: e.target.value })} placeholder="Mercado Envíos, Correo Argentino, retiro..." /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>N° de factura (ARCA)</Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="A-0001-00000123" /></div>
              <div><Label>URL de factura</Label><Input value={form.invoice_url} onChange={(e) => setForm({ ...form, invoice_url: e.target.value })} placeholder="https://..." /></div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Productos</Label>
                <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={addItem}><Plus className="h-3 w-3" />Agregar</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((it: SaleItem, idx: number) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select value={it.product_id} onValueChange={(v) => {
                        const p: any = products.find((x) => x.id === v);
                        updateItem(idx, { product_id: v, unit_price: p?.price_retail ?? p?.price ?? 0 });
                      }}>
                        <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                        <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} · Stock: {p.current_stock}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="w-20"><Input type="number" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} placeholder="Cant." /></div>
                    <div className="w-28"><Input type="number" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} placeholder="Precio" /></div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} disabled={form.items.length === 1}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Descuento</Label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
              <p className="text-right text-sm">Total: <span className="text-lg font-bold text-foreground">{fmt(grandTotal)}</span></p>
            </div>
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
