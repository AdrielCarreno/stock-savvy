import { friendlyError } from "@/lib/errors";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Building2, Pencil, FileText, History } from "lucide-react";
import { toast } from "sonner";
import { DocumentsManager } from "@/components/operations/DocumentsManager";
import { StarRating } from "@/components/operations/StarRating";

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
  rating: number | null;
}

const empty = { name: "", country: "", contact_name: "", contact_email: "", contact_phone: "", website: "", payment_terms: "", notes: "", rating: 0 };

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(empty);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    const { data, error } = await supabase.from("suppliers" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(friendlyError(error));
    else setSuppliers((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const loadHistory = async (id: string) => {
    const { data } = await supabase.from("imports" as any).select("id,code,status,fob_usd,estimated_arrival,created_at").eq("supplier_id", id).order("created_at", { ascending: false });
    setHistory((data as any) || []);
  };

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name, country: s.country ?? "", contact_name: s.contact_name ?? "", contact_email: s.contact_email ?? "",
      contact_phone: s.contact_phone ?? "", website: s.website ?? "", payment_terms: s.payment_terms ?? "",
      notes: s.notes ?? "", rating: s.rating ?? 0,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!u) return;
    const payload: any = { ...form, company_id: u.company_id, rating: form.rating || null };
    const q = editing
      ? supabase.from("suppliers" as any).update(payload).eq("id", editing.id)
      : supabase.from("suppliers" as any).insert(payload);
    const { error } = await q;
    if (error) return toast.error(friendlyError(error));
    toast.success(editing ? "Actualizado" : "Proveedor creado");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    await supabase.from("suppliers" as any).delete().eq("id", id); load();
  };

  const openDetail = async (s: Supplier) => { setDetail(s); await loadHistory(s.id); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus proveedores internacionales y locales.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nuevo proveedor</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>País</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="China, EE.UU..." /></div>
              <div><Label>Contacto</Label><Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
              <div className="col-span-2"><Label>Sitio web</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
              <div className="col-span-2"><Label>Términos de pago</Label><Input value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} placeholder="30% anticipo, 70% contra BL" /></div>
              <div className="col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="col-span-2"><Label>Calificación interna</Label><div className="mt-1"><StarRating value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} size={22} /></div></div>
            </div>
            <DialogFooter><Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Listado</CardTitle></CardHeader>
        <CardContent>
          {suppliers.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay proveedores registrados.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>País</TableHead><TableHead>Contacto</TableHead><TableHead>Calificación</TableHead><TableHead>Términos</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map(s => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => openDetail(s)}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.country || "-"}</TableCell>
                    <TableCell>{s.contact_name || "-"}</TableCell>
                    <TableCell><StarRating value={s.rating} readOnly /></TableCell>
                    <TableCell>{s.payment_terms || "-"}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <Tabs defaultValue="history">
              <TabsList>
                <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1" />Historial</TabsTrigger>
                <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5 mr-1" />Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="history">
                {history.length === 0 ? <p className="text-sm text-muted-foreground py-4">Sin compras registradas.</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Estado</TableHead><TableHead>FOB</TableHead><TableHead>ETA</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {history.map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{h.code}</TableCell>
                          <TableCell>{h.status}</TableCell>
                          <TableCell>US$ {Number(h.fob_usd).toLocaleString()}</TableCell>
                          <TableCell>{h.estimated_arrival || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="docs"><DocumentsManager entityType="supplier" entityId={detail.id} /></TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
