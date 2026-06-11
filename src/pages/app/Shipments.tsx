import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Plane, Calculator } from "lucide-react";
import { toast } from "sonner";

interface Shipment {
  id: string;
  tracking_number: string | null;
  carrier: string | null;
  transport_mode: string;
  container_number: string | null;
  bl_number: string | null;
  etd: string | null;
  eta: string | null;
  status: string;
}

export default function Shipments() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Shipment[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tracking_number: "", carrier: "", transport_mode: "maritimo", container_number: "", bl_number: "", etd: "", eta: "", status: "en_transito" });
  // Freight calculator
  const [fc, setFc] = useState({ weight: 0, volume: 0, ratePerKg: 5, ratePerCbm: 250, mode: "aereo" });

  const load = async () => {
    const { data, error } = await supabase.from("shipments" as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: userRow } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!userRow) return;
    const payload: any = { ...form, company_id: userRow.company_id };
    if (!payload.etd) delete payload.etd;
    if (!payload.eta) delete payload.eta;
    const { error } = await supabase.from("shipments" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Embarque registrado"); setOpen(false); load();
  };
  const remove = async (id: string) => {
    await supabase.from("shipments" as any).delete().eq("id", id); load();
  };

  const chargeable = fc.mode === "aereo" ? Math.max(fc.weight, fc.volume * 167) : fc.volume;
  const cost = fc.mode === "aereo" ? chargeable * fc.ratePerKg : fc.volume * fc.ratePerCbm;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Embarques</h1>
          <p className="text-sm text-muted-foreground">Trackeo de embarques marítimos, aéreos y terrestres.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo embarque</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo embarque</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tracking</Label><Input value={form.tracking_number} onChange={e => setForm({ ...form, tracking_number: e.target.value })} /></div>
              <div><Label>Transportista</Label><Input value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} placeholder="Maersk, MSC, DHL..." /></div>
              <div><Label>Modo</Label>
                <Select value={form.transport_mode} onValueChange={v => setForm({ ...form, transport_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maritimo">Marítimo</SelectItem>
                    <SelectItem value="aereo">Aéreo</SelectItem>
                    <SelectItem value="terrestre">Terrestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="en_transito">En tránsito</SelectItem>
                    <SelectItem value="en_aduana">En aduana</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Contenedor</Label><Input value={form.container_number} onChange={e => setForm({ ...form, container_number: e.target.value })} /></div>
              <div><Label>BL / AWB</Label><Input value={form.bl_number} onChange={e => setForm({ ...form, bl_number: e.target.value })} /></div>
              <div><Label>ETD</Label><Input type="date" value={form.etd} onChange={e => setForm({ ...form, etd: e.target.value })} /></div>
              <div><Label>ETA</Label><Input type="date" value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Crear</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="h-4 w-4" />Embarques</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin embarques.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Modo</TableHead><TableHead>Transportista</TableHead><TableHead>ETD</TableHead><TableHead>ETA</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.tracking_number || "-"}</TableCell>
                      <TableCell>{r.transport_mode}</TableCell>
                      <TableCell>{r.carrier || "-"}</TableCell>
                      <TableCell>{r.etd || "-"}</TableCell>
                      <TableCell>{r.eta || "-"}</TableCell>
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
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" />Calculadora de flete</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><Label>Modo</Label>
              <Select value={fc.mode} onValueChange={v => setFc({ ...fc, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aereo">Aéreo</SelectItem>
                  <SelectItem value="maritimo">Marítimo (LCL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso (kg)</Label><Input type="number" value={fc.weight} onChange={e => setFc({ ...fc, weight: +e.target.value })} /></div>
              <div><Label>Volumen (m³)</Label><Input type="number" value={fc.volume} onChange={e => setFc({ ...fc, volume: +e.target.value })} /></div>
              {fc.mode === "aereo" ? (
                <div className="col-span-2"><Label>USD por kg</Label><Input type="number" value={fc.ratePerKg} onChange={e => setFc({ ...fc, ratePerKg: +e.target.value })} /></div>
              ) : (
                <div className="col-span-2"><Label>USD por m³</Label><Input type="number" value={fc.ratePerCbm} onChange={e => setFc({ ...fc, ratePerCbm: +e.target.value })} /></div>
              )}
            </div>
            <div className="border-t pt-2 space-y-1">
              {fc.mode === "aereo" && <div className="flex justify-between"><span>Peso facturable:</span><b>{chargeable.toFixed(2)} kg</b></div>}
              <div className="flex justify-between text-base text-primary"><span>Costo flete:</span><b>US$ {cost.toFixed(2)}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
