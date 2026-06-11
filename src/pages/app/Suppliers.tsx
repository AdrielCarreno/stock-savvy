import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  country: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  payment_terms: string | null;
  notes: string | null;
}

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", website: "", payment_terms: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setSuppliers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    const { data: userRow } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!userRow) return toast.error("No se pudo obtener la empresa");
    const { error } = await supabase.from("suppliers" as any).insert({ ...form, company_id: userRow.company_id } as any);
    if (error) return toast.error(error.message);
    toast.success("Proveedor creado");
    setOpen(false);
    setForm({ name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", website: "", payment_terms: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus proveedores internacionales y locales.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo proveedor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo proveedor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>País</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="China, EE.UU, etc." /></div>
              <div><Label>Contacto</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Sitio web</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
              <div className="col-span-2"><Label>Términos de pago</Label><Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="30% anticipo, 70% contra BL" /></div>
              <div className="col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Listado</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay proveedores registrados.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>País</TableHead><TableHead>Contacto</TableHead><TableHead>Email</TableHead><TableHead>Términos</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.country || "-"}</TableCell>
                    <TableCell>{s.contact_name || "-"}</TableCell>
                    <TableCell>{s.contact_email || "-"}</TableCell>
                    <TableCell>{s.payment_terms || "-"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
