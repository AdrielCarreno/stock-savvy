import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Ship, Calculator } from "lucide-react";
import { toast } from "sonner";

interface ImportRow {
  id: string;
  code: string;
  origin_country: string | null;
  status: string;
  fob_usd: number;
  freight_usd: number;
  insurance_usd: number;
  exchange_rate: number;
  estimated_arrival: string | null;
}

export default function Imports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", origin_country: "", status: "planificada", fob_usd: 0, freight_usd: 0, insurance_usd: 0, exchange_rate: 1000, estimated_arrival: "" });
  // Calculator
  const [calc, setCalc] = useState({ fob: 0, freight: 0, insurance: 0, duty: 16, vat: 21, rate: 1000 });

  const load = async () => {
    const { data, error } = await supabase.from("imports" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code.trim()) return toast.error("Código requerido");
    const { data: userRow } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!userRow) return;
    const payload: any = { ...form, company_id: userRow.company_id };
    if (!payload.estimated_arrival) delete payload.estimated_arrival;
    const { error } = await supabase.from("imports" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Importación creada");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("imports" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const cif = calc.fob + calc.freight + calc.insurance;
  const duties = cif * (calc.duty / 100);
  const vatBase = cif + duties;
  const vat = vatBase * (calc.vat / 100);
  const totalUsd = cif + duties + vat;
  const totalArs = totalUsd * calc.rate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Importaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona todas tus operaciones de importación.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva importación</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva importación</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="IMP-2026-001" /></div>
              <div><Label>País de origen</Label><Input value={form.origin_country} onChange={e => setForm({ ...form, origin_country: e.target.value })} /></div>
              <div><Label>FOB (USD)</Label><Input type="number" value={form.fob_usd} onChange={e => setForm({ ...form, fob_usd: +e.target.value })} /></div>
              <div><Label>Flete (USD)</Label><Input type="number" value={form.freight_usd} onChange={e => setForm({ ...form, freight_usd: +e.target.value })} /></div>
              <div><Label>Seguro (USD)</Label><Input type="number" value={form.insurance_usd} onChange={e => setForm({ ...form, insurance_usd: +e.target.value })} /></div>
              <div><Label>Tipo de cambio</Label><Input type="number" value={form.exchange_rate} onChange={e => setForm({ ...form, exchange_rate: +e.target.value })} /></div>
              <div className="col-span-2"><Label>Llegada estimada</Label><Input type="date" value={form.estimated_arrival} onChange={e => setForm({ ...form, estimated_arrival: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Ship className="h-4 w-4" />Operaciones</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin operaciones todavía.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Origen</TableHead><TableHead>Estado</TableHead><TableHead>FOB USD</TableHead><TableHead>ETA</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.code}</TableCell>
                      <TableCell>{r.origin_country || "-"}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>${Number(r.fob_usd).toLocaleString()}</TableCell>
                      <TableCell>{r.estimated_arrival || "-"}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
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
              <div className="flex justify-between"><span>Valor CIF:</span><b>US$ {cif.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>Aranceles:</span><b>US$ {duties.toFixed(2)}</b></div>
              <div className="flex justify-between"><span>IVA:</span><b>US$ {vat.toFixed(2)}</b></div>
              <div className="flex justify-between text-base"><span>Total USD:</span><b>US$ {totalUsd.toFixed(2)}</b></div>
              <div className="flex justify-between text-primary"><span>Total ARS:</span><b>$ {totalArs.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
