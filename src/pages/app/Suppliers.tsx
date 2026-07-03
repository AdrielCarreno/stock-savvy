import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type Supplier = { id: string; name: string; country?: string | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; payment_terms?: string | null; notes?: string | null };

const empty = { name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", payment_terms: "", notes: "" };

export default function Suppliers() {
  const { company } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

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

      <div className="rounded-xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Aún no cargaste proveedores.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.country ?? "-"}</TableCell>
                  <TableCell>{s.contact_name ?? "-"}</TableCell>
                  <TableCell>{s.contact_email ?? "-"}</TableCell>
                  <TableCell>{s.contact_phone ?? "-"}</TableCell>
                  <TableCell>{s.payment_terms ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditId(s.id); setForm({ ...empty, ...s }); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
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
              <div><Label>Teléfono</Label><Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
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
