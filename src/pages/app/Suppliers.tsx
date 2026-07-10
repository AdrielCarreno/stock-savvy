import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Truck, Search, Filter, MessageCircle, Mail, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type Supplier = { id: string; name: string; country?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; payment_terms?: string | null; notes?: string | null };

const empty = { name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", payment_terms: "", notes: "" };
const cleanPhone = (p?: string | null) => (p ?? "").replace(/[^\d]/g, "");

export default function Suppliers() {
  const { company } = useAuth();
  const { products } = useProducts();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [productsBySupplier, setProductsBySupplier] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: sups, error }, { data: sp }] = await Promise.all([
      supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("supplier_products").select("supplier_id, product_id"),
    ]);
    if (error) toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    setRows((sups ?? []) as any);
    const map = new Map<string, string[]>();
    (sp ?? []).forEach((r: any) => {
      const arr = map.get(r.supplier_id) ?? [];
      arr.push(r.product_id);
      map.set(r.supplier_id, arr);
    });
    setProductsBySupplier(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const productNameById = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [products]);

  const countries = useMemo(() => Array.from(new Set(rows.map((s) => s.country).filter(Boolean))) as string[], [rows]);
  const filtered = useMemo(() => rows.filter((s) => {
    if (countryFilter !== "all" && s.country !== countryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.contact_name?.toLowerCase().includes(q) || s.contact_email?.toLowerCase().includes(q);
    }
    return true;
  }), [rows, search, countryFilter]);

  const openNew = () => {
    setForm(empty); setEditId(null); setSelectedProductIds(new Set()); setOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditId(s.id); setForm({ ...empty, ...s });
    setSelectedProductIds(new Set(productsBySupplier.get(s.id) ?? []));
    setOpen(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!form.name.trim()) return toast({ title: "El nombre es obligatorio", variant: "destructive" });
    if (!company?.id) return;
    setSaving(true);
    let supplierId = editId;
    if (editId) {
      const { error } = await supabase.from("suppliers").update(form).eq("id", editId);
      if (error) { setSaving(false); return toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); }
    } else {
      const { data, error } = await supabase.from("suppliers").insert({ ...form, company_id: company.id }).select("id").maybeSingle();
      if (error || !data) { setSaving(false); return toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); }
      supplierId = data.id;
    }
    // Reset supplier_products for this supplier
    if (supplierId) {
      await (supabase as any).from("supplier_products").delete().eq("supplier_id", supplierId);
      if (selectedProductIds.size > 0) {
        const inserts = Array.from(selectedProductIds).map((product_id) => ({
          supplier_id: supplierId, product_id, company_id: company.id,
        }));
        const { error: spErr } = await (supabase as any).from("supplier_products").insert(inserts);
        if (spErr) toast({ title: "Aviso", description: "Proveedor guardado pero no se pudieron asociar todos los productos.", variant: "destructive" });
      }
    }
    setSaving(false);
    setOpen(false); setForm(empty); setEditId(null); setSelectedProductIds(new Set());
    toast({ title: editId ? "Proveedor actualizado" : "Proveedor creado" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    load();
  };

  const renderProducts = (supplierId: string) => {
    const ids = productsBySupplier.get(supplierId) ?? [];
    if (ids.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    const names = ids.map((id) => productNameById.get(id)).filter(Boolean) as string[];
    const first = names.slice(0, 2);
    const rest = names.length - first.length;
    return (
      <div className="flex flex-wrap gap-1 max-w-[240px]">
        {first.map((n) => <Badge key={n} variant="secondary" className="text-[10px] gap-1"><Package className="h-2.5 w-2.5" />{n}</Badge>)}
        {rest > 0 && <Badge variant="outline" className="text-[10px]">+{rest}</Badge>}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Proveedores</h2>
          <p className="text-sm text-muted-foreground">Base de proveedores con productos que provee y contacto</p>
        </div>
        <Button onClick={openNew} className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, contacto o email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filtros:</div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="País" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los países</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Aún no cargaste proveedores." : "Sin resultados."}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Productos que provee</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead className="text-center">Contactar</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const phone = cleanPhone(s.contact_phone);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.country ?? "-"}</TableCell>
                    <TableCell>{renderProducts(s.id)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{s.contact_name ?? "-"}</div>
                      {s.contact_email && <div className="text-xs text-muted-foreground">{s.contact_email}</div>}
                      {s.contact_phone && <div className="text-xs text-muted-foreground">{s.contact_phone}</div>}
                    </TableCell>
                    <TableCell>{s.payment_terms ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {phone ? (
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-success" /></a>
                          </Button>
                        ) : null}
                        {s.contact_email ? (
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                            <a href={`mailto:${s.contact_email}`}><Mail className="h-4 w-4 text-primary" /></a>
                          </Button>
                        ) : null}
                        {!phone && !s.contact_email && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Tarjetas (móvil) */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Aún no cargaste proveedores." : "Sin resultados."}</div>
        ) : filtered.map((s) => {
          const phone = cleanPhone(s.contact_phone);
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{s.name}</p>
                  {s.country && <p className="text-xs text-muted-foreground">{s.country}</p>}
                  {s.contact_name && <p className="mt-1 text-sm truncate">{s.contact_name}</p>}
                  {s.contact_email && <p className="text-xs text-muted-foreground truncate">{s.contact_email}</p>}
                  {s.contact_phone && <p className="text-xs text-muted-foreground">{s.contact_phone}</p>}
                  {s.payment_terms && <p className="mt-1 text-[10px] text-muted-foreground">Pago: {s.payment_terms}</p>}
                  <div className="mt-2">{renderProducts(s.id)}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {phone && (
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                      <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-success" /></a>
                    </Button>
                  )}
                  {s.contact_email && (
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                      <a href={`mailto:${s.contact_email}`}><Mail className="h-4 w-4 text-primary" /></a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-1 border-t border-border pt-2">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} proveedor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>País</Label><Input value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Condiciones de pago</Label><Input value={form.payment_terms ?? ""} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="30 días, contado..." /></div>
            </div>
            <div>
              <Label>Productos que provee</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="text-sm">
                      {selectedProductIds.size === 0 ? "Seleccionar productos..." : `${selectedProductIds.size} seleccionado(s)`}
                    </span>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                    {products.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">Aún no tenés productos cargados.</p>
                    ) : products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer">
                        <Checkbox checked={selectedProductIds.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                        <span className="text-sm flex-1 truncate">{p.name}</span>
                        {p.sku && <code className="text-[10px] text-muted-foreground">{p.sku}</code>}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedProductIds.size > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(selectedProductIds).slice(0, 5).map((id) => (
                    <Badge key={id} variant="secondary" className="text-[10px]">{productNameById.get(id) ?? id}</Badge>
                  ))}
                  {selectedProductIds.size > 5 && <Badge variant="outline" className="text-[10px]">+{selectedProductIds.size - 5}</Badge>}
                </div>
              )}
            </div>
            <div><Label>Contacto</Label><Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>WhatsApp / Teléfono</Label><Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="549..." /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
