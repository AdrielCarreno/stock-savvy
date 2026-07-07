import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Users, Search, Filter, MessageCircle, Mail } from "lucide-react";
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

const cleanPhone = (p?: string | null) => (p ?? "").replace(/[^\d]/g, "");

type Customer = { id: string; name: string; email?: string | null; phone?: string | null; tax_id?: string | null; address?: string | null; notes?: string | null; balance: number };

const empty = { name: "", email: "", phone: "", tax_id: "", address: "", notes: "", balance: 0 };

export default function Customers() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const submit = async () => {
    if (!form.name.trim()) return toast({ title: "El nombre es obligatorio", variant: "destructive" });
    const payload = { ...form, balance: Number(form.balance) || 0 };
    if (editId) {
      const { error } = await supabase.from("customers").update(payload).eq("id", editId);
      if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    } else {
      if (!company?.id) return;
      const { error } = await supabase.from("customers").insert({ ...payload, company_id: company.id });
      if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    }
    setOpen(false); setForm(empty); setEditId(null); load();
    toast({ title: editId ? "Cliente actualizado" : "Cliente creado" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    load();
  };

  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const filtered = useMemo(() => rows.filter((c: any) => {
    if (balanceFilter === "debt" && !(c.balance > 0)) return false;
    if (balanceFilter === "credit" && !(c.balance < 0)) return false;
    if (balanceFilter === "zero" && Number(c.balance) !== 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.tax_id?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    }
    return true;
  }), [rows, search, balanceFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Clientes</h2>
          <p className="text-sm text-muted-foreground">Clientes recurrentes, mayoristas y cuentas corrientes</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Nuevo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, CUIT/DNI o email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filtros:</div>
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Saldo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="debt">Nos adeudan</SelectItem>
              <SelectItem value="credit">Les adeudamos</SelectItem>
              <SelectItem value="zero">Sin saldo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{rows.length === 0 ? "Aún no cargaste clientes." : "Sin resultados."}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT / DNI</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Saldo cta cte</TableHead>
                <TableHead className="text-center">Contactar</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => {
                const phone = cleanPhone(c.phone);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.tax_id ?? "-"}</TableCell>
                    <TableCell>
                      {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                      {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                      {!c.email && !c.phone && <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className={`text-right ${c.balance > 0 ? "text-destructive font-medium" : c.balance < 0 ? "text-success font-medium" : ""}`}>{fmt(c.balance)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {phone && <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="WhatsApp"><a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-success" /></a></Button>}
                        {c.email && <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Email"><a href={`mailto:${c.email}`}><Mail className="h-4 w-4 text-primary" /></a></Button>}
                        {!phone && !c.email && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(c.id); setForm({ ...empty, ...c }); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nuevo"} cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CUIT / DNI</Label><Input value={form.tax_id ?? ""} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} /></div>
              <div><Label>Saldo cta cte</Label><Input type="number" value={form.balance ?? 0} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Dirección</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
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
