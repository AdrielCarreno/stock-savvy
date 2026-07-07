import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Truck, Search, Filter, MessageCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type Supplier = { id: string; name: string; country?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; payment_terms?: string | null; notes?: string | null };

const empty = { name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", payment_terms: "", notes: "" };

const cleanPhone = (p?: string | null) => (p ?? "").replace(/[^\d]/g, "");

export default function Suppliers() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const countries = useMemo(() => Array.from(new Set(rows.map((s) => s.country).filter(Boolean))) as string[], [rows]);
  const filtered = useMemo(() => rows.filter((s) => {
    if (countryFilter !== "all" && s.country !== countryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.contact_name?.toLowerCase().includes(q) || s.contact_email?.toLowerCase().includes(q);
    }
    return true;
  }), [rows, search, countryFilter]);

  const submit = async () => {
    if (!form.name.trim()) return toast({ title: "El nombre es obligatorio", variant: "destructive" });
    if (editId) {
      const { error } = await supabase.from("suppliers").update(form).eq("id", editId);
      if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    } else {
      if (!company?.id) return;
      const { error } = await supabase.from("suppliers").insert({ ...form, company_id: company.id });
      if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    }
    setOpen(false); setForm(empty); setEditId(null); load();
    toast({ title: editId ? "Proveedor actualizado" : "Proveedor creado" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Proveedores</h2>
          <p className="text-sm text-muted-foreground">Base de proveedores con condiciones comerciales y contacto</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, contacto o email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filtros:</div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="País" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los países</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
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
                    <TableCell>
                      <div className="text-sm">{s.contact_name ?? "-"}</div>
                      {s.contact_email && <div className="text-xs text-muted-foreground">{s.contact_email}</div>}
                      {s.contact_phone && <div className="text-xs text-muted-foreground">{s.contact_phone}</div>}
                    </TableCell>
                    <TableCell>{s.payment_terms ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {phone ? (
                          <Button asChild size="icon" variant="ghost" title="WhatsApp" className="h-8 w-8">
                            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-success" /></a>
                          </Button>
                        ) : null}
                        {s.contact_email ? (
                          <Button asChild size="icon" variant="ghost" title="Email" className="h-8 w-8">
                            <a href={`mailto:${s.contact_email}`}><Mail className="h-4 w-4 text-primary" /></a>
                          </Button>
                        ) : null}
                        {!phone && !s.contact_email && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(s.id); setForm({ ...empty, ...s }); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} proveedor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>País</Label><Input value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div><Label>Condiciones de pago</Label><Input value={form.payment_terms ?? ""} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="30 días, contado..." /></div>
            </div>
            <div><Label>Contacto</Label><Input value={form.contact_name ?? ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>WhatsApp / Teléfono</Label><Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="549..." /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
