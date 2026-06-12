import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText, Calculator, Pencil, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { DocumentsManager } from "@/components/operations/DocumentsManager";
import { cn } from "@/lib/utils";

interface Declaration {
  id: string;
  declaration_number: string | null;
  declaration_date: string | null;
  tariff_position: string | null;
  cif_value_usd: number;
  duties_amount: number;
  taxes_amount: number;
  broker: string | null;
  status: string;
}

const STATUSES = [
  { key: "pendiente", label: "Pendiente", color: "bg-slate-100 text-slate-700" },
  { key: "en_revision", label: "En revisión", color: "bg-blue-100 text-blue-700" },
  { key: "observado", label: "Observado", color: "bg-red-100 text-red-700" },
  { key: "liberado", label: "Liberado", color: "bg-green-100 text-green-700" },
];

const DEFAULT_CHECKLIST = ["Factura comercial", "Packing list", "BL / AWB", "Certificado de origen", "Declaración jurada (SIMI)", "Liquidación de tributos"];

const empty = { declaration_number: "", declaration_date: "", tariff_position: "", cif_value_usd: 0, duties_amount: 0, taxes_amount: 0, broker: "", status: "pendiente" };

export default function Customs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Declaration[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Declaration | null>(null);
  const [form, setForm] = useState(empty);
  const [detail, setDetail] = useState<Declaration | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [tc, setTc] = useState({ cif: 0, duty: 16, statistics: 3, vat: 21, vatExtra: 20, gains: 6, iibb: 2.5 });

  const load = async () => {
    const { data, error } = await supabase.from("customs_declarations" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const loadChecklist = async (id: string) => {
    let { data } = await supabase.from("customs_checklist" as any).select("*").eq("customs_id", id).order("created_at");
    if (!data || data.length === 0) {
      const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
      if (u) {
        await supabase.from("customs_checklist" as any).insert(DEFAULT_CHECKLIST.map(item => ({ company_id: u.company_id, customs_id: id, item })) as any);
        ({ data } = await supabase.from("customs_checklist" as any).select("*").eq("customs_id", id).order("created_at"));
      }
    }
    setChecklist((data as any) || []);
  };

  const toggleItem = async (id: string, checked: boolean) => {
    await supabase.from("customs_checklist" as any).update({ checked } as any).eq("id", id);
    setChecklist(c => c.map(x => x.id === id ? { ...x, checked } : x));
  };
  const addItem = async () => {
    if (!newItem.trim() || !detail) return;
    const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!u) return;
    await supabase.from("customs_checklist" as any).insert({ company_id: u.company_id, customs_id: detail.id, item: newItem.trim() } as any);
    setNewItem(""); loadChecklist(detail.id);
  };
  const removeItem = async (id: string) => {
    await supabase.from("customs_checklist" as any).delete().eq("id", id);
    setChecklist(c => c.filter(x => x.id !== id));
  };

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: Declaration) => {
    setEditing(d);
    setForm({
      declaration_number: d.declaration_number ?? "", declaration_date: d.declaration_date ?? "",
      tariff_position: d.tariff_position ?? "", cif_value_usd: Number(d.cif_value_usd),
      duties_amount: Number(d.duties_amount), taxes_amount: Number(d.taxes_amount),
      broker: d.broker ?? "", status: d.status,
    });
    setOpen(true);
  };

  const save = async () => {
    const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!u) return;
    const payload: any = { ...form, company_id: u.company_id };
    if (!payload.declaration_date) delete payload.declaration_date;
    const q = editing
      ? supabase.from("customs_declarations" as any).update(payload).eq("id", editing.id)
      : supabase.from("customs_declarations" as any).insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Actualizado" : "Declaración registrada");
    setOpen(false); load();
  };

  const remove = async (id: string) => { await supabase.from("customs_declarations" as any).delete().eq("id", id); load(); };

  const openDetail = async (d: Declaration) => { setDetail(d); await loadChecklist(d.id); };

  const duty = tc.cif * (tc.duty / 100);
  const stats = tc.cif * (tc.statistics / 100);
  const base = tc.cif + duty + stats;
  const vat = base * (tc.vat / 100);
  const vatExtra = base * (tc.vatExtra / 100);
  const gains = base * (tc.gains / 100);
  const iibb = base * (tc.iibb / 100);
  const total = duty + stats + vat + vatExtra + gains + iibb;

  const badge = (s: string) => {
    const st = STATUSES.find(x => x.key === s);
    return <Badge className={cn("font-normal", st?.color ?? "bg-secondary")}>{st?.label ?? s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Aduana</h1>
          <p className="text-sm text-muted-foreground">Declaraciones, despachos y cálculo de tributos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nueva declaración</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar declaración" : "Nueva declaración aduanera"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>N° Despacho</Label><Input value={form.declaration_number} onChange={e => setForm({ ...form, declaration_number: e.target.value })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.declaration_date} onChange={e => setForm({ ...form, declaration_date: e.target.value })} /></div>
              <div><Label>Posición arancelaria</Label><Input value={form.tariff_position} onChange={e => setForm({ ...form, tariff_position: e.target.value })} /></div>
              <div><Label>Despachante</Label><Input value={form.broker} onChange={e => setForm({ ...form, broker: e.target.value })} /></div>
              <div><Label>CIF (USD)</Label><Input type="number" value={form.cif_value_usd} onChange={e => setForm({ ...form, cif_value_usd: +e.target.value })} /></div>
              <div><Label>Derechos (USD)</Label><Input type="number" value={form.duties_amount} onChange={e => setForm({ ...form, duties_amount: +e.target.value })} /></div>
              <div><Label>Impuestos (USD)</Label><Input type="number" value={form.taxes_amount} onChange={e => setForm({ ...form, taxes_amount: +e.target.value })} /></div>
              <div><Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Despachos</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin despachos.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Fecha</TableHead><TableHead>NCM</TableHead><TableHead>CIF</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                      <TableCell className="font-medium">{r.declaration_number || "-"}</TableCell>
                      <TableCell>{r.declaration_date || "-"}</TableCell>
                      <TableCell>{r.tariff_position || "-"}</TableCell>
                      <TableCell>US$ {Number(r.cif_value_usd).toLocaleString()}</TableCell>
                      <TableCell>{badge(r.status)}</TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" />Calculadora tributos AR</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><Label>CIF (USD)</Label><Input type="number" value={tc.cif} onChange={e => setTc({ ...tc, cif: +e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>D.I. %</Label><Input type="number" value={tc.duty} onChange={e => setTc({ ...tc, duty: +e.target.value })} /></div>
              <div><Label>Tasa estad. %</Label><Input type="number" value={tc.statistics} onChange={e => setTc({ ...tc, statistics: +e.target.value })} /></div>
              <div><Label>IVA %</Label><Input type="number" value={tc.vat} onChange={e => setTc({ ...tc, vat: +e.target.value })} /></div>
              <div><Label>IVA adic. %</Label><Input type="number" value={tc.vatExtra} onChange={e => setTc({ ...tc, vatExtra: +e.target.value })} /></div>
              <div><Label>Ganancias %</Label><Input type="number" value={tc.gains} onChange={e => setTc({ ...tc, gains: +e.target.value })} /></div>
              <div><Label>IIBB %</Label><Input type="number" value={tc.iibb} onChange={e => setTc({ ...tc, iibb: +e.target.value })} /></div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between"><span>Derechos:</span><b>US$ {duty.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>Tasa estad.:</span><b>US$ {stats.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>IVA:</span><b>US$ {vat.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>IVA adicional:</span><b>US$ {vatExtra.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>Ganancias:</span><b>US$ {gains.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>IIBB:</span><b>US$ {iibb.toFixed(2)}</b></div>
              <div className="flex justify-between text-base text-primary border-t pt-2"><span>Total tributos:</span><b>US$ {total.toFixed(2)}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Despacho {detail?.declaration_number || ""}</DialogTitle></DialogHeader>
          {detail && (
            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist"><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Checklist</TabsTrigger>
                <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5 mr-1" />Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist" className="space-y-2">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
                    <Checkbox checked={item.checked} onCheckedChange={(v) => toggleItem(item.id, !!v)} />
                    <span className={cn("flex-1 text-sm", item.checked && "line-through text-muted-foreground")}>{item.item}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Agregar item..." onKeyDown={e => e.key === "Enter" && addItem()} />
                  <Button onClick={addItem}>Agregar</Button>
                </div>
              </TabsContent>
              <TabsContent value="docs"><DocumentsManager entityType="customs" entityId={detail.id} /></TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
