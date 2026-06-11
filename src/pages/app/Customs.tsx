import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText, Calculator } from "lucide-react";
import { toast } from "sonner";

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

export default function Customs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Declaration[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ declaration_number: "", declaration_date: "", tariff_position: "", cif_value_usd: 0, duties_amount: 0, taxes_amount: 0, broker: "", status: "pendiente" });
  // Taxes calculator (AR import scheme)
  const [tc, setTc] = useState({ cif: 0, duty: 16, statistics: 3, vat: 21, vatExtra: 20, gains: 6, iibb: 2.5 });

  const load = async () => {
    const { data, error } = await supabase.from("customs_declarations" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: userRow } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!userRow) return;
    const payload: any = { ...form, company_id: userRow.company_id };
    if (!payload.declaration_date) delete payload.declaration_date;
    const { error } = await supabase.from("customs_declarations" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Declaración registrada"); setOpen(false); load();
  };
  const remove = async (id: string) => {
    await supabase.from("customs_declarations" as any).delete().eq("id", id); load();
  };

  const duty = tc.cif * (tc.duty / 100);
  const stats = tc.cif * (tc.statistics / 100);
  const base = tc.cif + duty + stats;
  const vat = base * (tc.vat / 100);
  const vatExtra = base * (tc.vatExtra / 100);
  const gains = base * (tc.gains / 100);
  const iibb = base * (tc.iibb / 100);
  const total = duty + stats + vat + vatExtra + gains + iibb;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Aduana</h1>
          <p className="text-sm text-muted-foreground">Declaraciones, despachos y cálculo de tributos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva declaración</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva declaración aduanera</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>N° Despacho</Label><Input value={form.declaration_number} onChange={e => setForm({ ...form, declaration_number: e.target.value })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.declaration_date} onChange={e => setForm({ ...form, declaration_date: e.target.value })} /></div>
              <div><Label>Posición arancelaria</Label><Input value={form.tariff_position} onChange={e => setForm({ ...form, tariff_position: e.target.value })} /></div>
              <div><Label>Despachante</Label><Input value={form.broker} onChange={e => setForm({ ...form, broker: e.target.value })} /></div>
              <div><Label>Valor CIF (USD)</Label><Input type="number" value={form.cif_value_usd} onChange={e => setForm({ ...form, cif_value_usd: +e.target.value })} /></div>
              <div><Label>Derechos (USD)</Label><Input type="number" value={form.duties_amount} onChange={e => setForm({ ...form, duties_amount: +e.target.value })} /></div>
              <div><Label>Impuestos (USD)</Label><Input type="number" value={form.taxes_amount} onChange={e => setForm({ ...form, taxes_amount: +e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Despachos</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin despachos.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Fecha</TableHead><TableHead>NCM</TableHead><TableHead>CIF</TableHead><TableHead>Despachante</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.declaration_number || "-"}</TableCell>
                      <TableCell>{r.declaration_date || "-"}</TableCell>
                      <TableCell>{r.tariff_position || "-"}</TableCell>
                      <TableCell>US$ {Number(r.cif_value_usd).toLocaleString()}</TableCell>
                      <TableCell>{r.broker || "-"}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" />Calculadora de tributos AR</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><Label>Valor CIF (USD)</Label><Input type="number" value={tc.cif} onChange={e => setTc({ ...tc, cif: +e.target.value })} /></div>
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
    </div>
  );
}
