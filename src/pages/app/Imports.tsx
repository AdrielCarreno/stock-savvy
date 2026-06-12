import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Ship, Calculator, Pencil, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { DocumentsManager } from "@/components/operations/DocumentsManager";
import { cn } from "@/lib/utils";

interface ImportRow {
  id: string;
  code: string;
  origin_country: string | null;
  status: string;
  stage: string;
  fob_usd: number;
  freight_usd: number;
  insurance_usd: number;
  exchange_rate: number;
  estimated_arrival: string | null;
  supplier_id: string | null;
}

const STAGES = [
  { key: "cotizacion", label: "Cotización" },
  { key: "compra", label: "Compra" },
  { key: "embarque", label: "Embarque" },
  { key: "aduana", label: "Aduana" },
  { key: "entregada", label: "Entregada" },
];

const STATUSES = [
  { key: "activa", label: "Activa", color: "bg-blue-100 text-blue-700" },
  { key: "en_transito", label: "En tránsito", color: "bg-amber-100 text-amber-700" },
  { key: "en_aduana", label: "En aduana", color: "bg-orange-100 text-orange-700" },
  { key: "finalizada", label: "Finalizada", color: "bg-green-100 text-green-700" },
];

const emptyForm = { code: "", origin_country: "", status: "activa", stage: "cotizacion", fob_usd: 0, freight_usd: 0, insurance_usd: 0, exchange_rate: 1000, estimated_arrival: "", supplier_id: "" };

export default function Imports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ImportRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [docsFor, setDocsFor] = useState<ImportRow | null>(null);
  const [calc, setCalc] = useState({ fob: 0, freight: 0, insurance: 0, duty: 16, vat: 21, rate: 1000 });

  const load = async () => {
    const [{ data: imps }, { data: sups }] = await Promise.all([
      supabase.from("imports" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers" as any).select("id, name").order("name"),
    ]);
    setRows((imps as any) || []);
    setSuppliers((sups as any) || []);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: ImportRow) => {
    setEditing(r);
    setForm({
      code: r.code, origin_country: r.origin_country ?? "", status: r.status, stage: r.stage,
      fob_usd: Number(r.fob_usd), freight_usd: Number(r.freight_usd), insurance_usd: Number(r.insurance_usd),
      exchange_rate: Number(r.exchange_rate), estimated_arrival: r.estimated_arrival ?? "", supplier_id: r.supplier_id ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) return toast.error("Código requerido");
    const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!u) return;
    const payload: any = { ...form, company_id: u.company_id };
    if (!payload.estimated_arrival) delete payload.estimated_arrival;
    if (!payload.supplier_id) delete payload.supplier_id;
    const q = editing
      ? supabase.from("imports" as any).update(payload).eq("id", editing.id)
      : supabase.from("imports" as any).insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success(editing ? "Actualizado" : "Importación creada");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("imports" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const cif = calc.fob + calc.freight + calc.insurance;
  const duties = cif * (calc.duty / 100);
  const vat = (cif + duties) * (calc.vat / 100);
  const totalUsd = cif + duties + vat;

  const statusBadge = (s: string) => {
    const st = STATUSES.find(x => x.key === s);
    return <Badge className={cn("font-normal", st?.color ?? "bg-secondary")}>{st?.label ?? s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Importaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona todas tus operaciones de importación.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nueva importación</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Editar importación" : "Nueva importación"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="IMP-2026-001" /></div>
              <div><Label>País origen</Label><Input value={form.origin_country} onChange={e => setForm({ ...form, origin_country: e.target.value })} /></div>
              <div className="col-span-2"><Label>Proveedor</Label>
                <Select value={form.supplier_id || "none"} onValueChange={v => setForm({ ...form, supplier_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Etapa</Label>
                <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>FOB (USD)</Label><Input type="number" value={form.fob_usd} onChange={e => setForm({ ...form, fob_usd: +e.target.value })} /></div>
              <div><Label>Flete (USD)</Label><Input type="number" value={form.freight_usd} onChange={e => setForm({ ...form, freight_usd: +e.target.value })} /></div>
              <div><Label>Seguro (USD)</Label><Input type="number" value={form.insurance_usd} onChange={e => setForm({ ...form, insurance_usd: +e.target.value })} /></div>
              <div><Label>Tipo de cambio</Label><Input type="number" value={form.exchange_rate} onChange={e => setForm({ ...form, exchange_rate: +e.target.value })} /></div>
              <div className="col-span-2"><Label>Llegada estimada</Label><Input type="date" value={form.estimated_arrival} onChange={e => setForm({ ...form, estimated_arrival: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Ship className="h-4 w-4" />Operaciones</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin operaciones todavía.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Origen</TableHead><TableHead>Etapa</TableHead><TableHead>Estado</TableHead><TableHead>FOB</TableHead><TableHead>ETA</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map(r => {
                    const stageIdx = STAGES.findIndex(s => s.key === r.stage);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.code}</TableCell>
                        <TableCell>{r.origin_country || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {STAGES.map((s, i) => (
                              <div key={s.key} title={s.label} className={cn("h-1.5 w-5 rounded", i <= stageIdx ? "bg-primary" : "bg-muted")} />
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">{STAGES[stageIdx]?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell>${Number(r.fob_usd).toLocaleString()}</TableCell>
                        <TableCell>{r.estimated_arrival || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDocsFor(r)} title="Documentos"><FileText className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" />Calculadora de costos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>FOB</Label><Input type="number" value={calc.fob} onChange={e => setCalc({ ...calc, fob: +e.target.value })} /></div>
              <div><Label>Flete</Label><Input type="number" value={calc.freight} onChange={e => setCalc({ ...calc, freight: +e.target.value })} /></div>
              <div><Label>Seguro</Label><Input type="number" value={calc.insurance} onChange={e => setCalc({ ...calc, insurance: +e.target.value })} /></div>
              <div><Label>Arancel %</Label><Input type="number" value={calc.duty} onChange={e => setCalc({ ...calc, duty: +e.target.value })} /></div>
              <div><Label>IVA %</Label><Input type="number" value={calc.vat} onChange={e => setCalc({ ...calc, vat: +e.target.value })} /></div>
              <div><Label>Cambio ARS</Label><Input type="number" value={calc.rate} onChange={e => setCalc({ ...calc, rate: +e.target.value })} /></div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between"><span>CIF:</span><b>US$ {cif.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>Aranceles:</span><b>US$ {duties.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>IVA:</span><b>US$ {vat.toFixed(2)}</b></div>
              <div className="flex justify-between text-base"><span>Total USD:</span><b>US$ {totalUsd.toFixed(2)}</b></div>
              <div className="flex justify-between text-primary"><span>Total ARS:</span><b>$ {(totalUsd * calc.rate).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline activas */}
      <Card>
        <CardHeader><CardTitle>Timeline de importaciones activas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {rows.filter(r => r.status !== "finalizada").length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay importaciones activas.</p>
          ) : rows.filter(r => r.status !== "finalizada").map(r => {
            const idx = STAGES.findIndex(s => s.key === r.stage);
            return (
              <div key={r.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.code} <span className="text-muted-foreground">· {r.origin_country || "-"}</span></p>
                  {statusBadge(r.status)}
                </div>
                <div className="flex items-center">
                  {STAGES.map((s, i) => (
                    <div key={s.key} className="flex-1 flex items-center">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0", i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {i <= idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {i < STAGES.length - 1 && <div className={cn("h-0.5 flex-1", i < idx ? "bg-primary" : "bg-muted")} />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {STAGES.map(s => <span key={s.key} className="flex-1 text-center">{s.label}</span>)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!docsFor} onOpenChange={(o) => !o && setDocsFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Documentos · {docsFor?.code}</DialogTitle></DialogHeader>
          {docsFor && <DocumentsManager entityType="import" entityId={docsFor.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
