import { useEffect, useMemo, useState } from "react";
import { Loader2, FileText, Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";
import {
  isValidCuit, voucherTypeFor, computeFiscalTotals, assertMatchesSaleTotal,
  VOUCHER_LABELS, STATUS_LABELS, type IvaCondition, type ReceiverCondition,
} from "@/lib/fiscal";

type Settings = { cuit: string; legal_name: string; iva_condition: IvaCondition; fiscal_address: string; activity_start: string; iibb: string; sales_point: number; connection_status?: string };
type Invoice = { id: string; voucher_type: string; status: string; total: number; net_amount: number; iva_amount: number; receiver_name: string | null; created_at: string; number: number | null; cae: string | null; sale_id: string | null };
type SaleRow = { id: string; reference: string | null; sale_date: string; total: number; status: string; customer_id: string | null; customers: { name: string; tax_id: string | null } | null };

const emptySettings: Settings = { cuit: "", legal_name: "", iva_condition: "responsable_inscripto", fiscal_address: "", activity_start: "", iibb: "", sales_point: 1 };
const money = (n: number) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Invoicing() {
  const { profile, company, user } = useAuth();
  const companyId = profile?.company_id ?? company?.id ?? null;
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [hasSettings, setHasSettings] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleId, setSaleId] = useState("");
  const [receiver, setReceiver] = useState<ReceiverCondition>("consumidor_final");
  const [ivaRate, setIvaRate] = useState("21");

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const [s, i, v] = await Promise.all([
      supabase.from("fiscal_settings").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("fiscal_invoices").select("id,voucher_type,status,total,net_amount,iva_amount,receiver_name,created_at,number,cae,sale_id").order("created_at", { ascending: false }).limit(100),
      supabase.from("sales").select("id,reference,sale_date,total,status,customer_id,customers(name,tax_id)").neq("status", "annulled").order("sale_date", { ascending: false }).limit(100),
    ]);
    if (s.data) {
      setHasSettings(true);
      setSettings({ ...emptySettings, ...s.data, fiscal_address: s.data.fiscal_address ?? "", activity_start: s.data.activity_start ?? "", iibb: s.data.iibb ?? "", iva_condition: s.data.iva_condition as IvaCondition });
    }
    setInvoices((i.data ?? []) as Invoice[]);
    setSales((v.data ?? []) as unknown as SaleRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  const invoicedSales = useMemo(() => new Set(invoices.map((i) => i.sale_id).filter(Boolean)), [invoices]);

  const saveSettings = async () => {
    if (!companyId) return;
    const cuit = settings.cuit.replace(/\D/g, "");
    if (!isValidCuit(cuit)) return toast({ title: "CUIT inválido", description: "Revisá los 11 números.", variant: "destructive" });
    if (!settings.legal_name.trim()) return toast({ title: "Falta la razón social", variant: "destructive" });
    setSaving(true);
    const payload = {
      company_id: companyId, cuit, legal_name: settings.legal_name.trim(), iva_condition: settings.iva_condition,
      fiscal_address: settings.fiscal_address || null, activity_start: settings.activity_start || null,
      iibb: settings.iibb || null, sales_point: Number(settings.sales_point) || 1,
    };
    const { error } = await supabase.from("fiscal_settings").upsert(payload, { onConflict: "company_id" });
    setSaving(false);
    if (error) return toast({ title: "No se pudo guardar", description: friendlyError(error), variant: "destructive" });
    toast({ title: "Datos fiscales guardados" });
    load();
  };

  const createDraft = async () => {
    if (!companyId || !hasSettings) return toast({ title: "Primero guardá los datos fiscales", variant: "destructive" });
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    setSaving(true);
    try {
      const { data: items, error: itemsErr } = await supabase.from("sale_items").select("product_id,description,quantity,unit_price,subtotal,products(name)").eq("sale_id", sale.id);
      if (itemsErr) throw itemsErr;
      const rate = Number(ivaRate);
      const totals = computeFiscalTotals(
        (items ?? []).map((it: any) => ({ description: it.products?.name ?? it.description ?? "Producto", quantity: Number(it.quantity), unitPrice: Number(it.unit_price), ivaRate: rate })),
        settings.iva_condition,
      );
      assertMatchesSaleTotal(totals, Number(sale.total));
      const voucher = voucherTypeFor(settings.iva_condition, receiver);
      const { data: inv, error } = await supabase.from("fiscal_invoices").insert({
        company_id: companyId, sale_id: sale.id, customer_id: sale.customer_id, voucher_type: voucher,
        sales_point: settings.sales_point, receiver_name: sale.customers?.name ?? "Consumidor final",
        receiver_doc: sale.customers?.tax_id ?? null, receiver_iva_condition: receiver,
        net_amount: totals.net + (0), iva_amount: totals.iva, exempt_amount: totals.exempt, total: totals.total,
        snapshot: { issuer: { cuit: settings.cuit, legal_name: settings.legal_name, iva_condition: settings.iva_condition }, sale_reference: sale.reference },
        created_by: user?.id ?? null,
      }).select("id").single();
      if (error) throw error;
      const { error: linesErr } = await supabase.from("fiscal_invoice_items").insert(totals.lines.map((l, idx) => ({
        company_id: companyId, invoice_id: inv.id, product_id: (items as any)[idx]?.product_id ?? null, description: l.description,
        quantity: l.quantity, unit_price: l.unitPrice, discount: l.discount, iva_rate: l.ivaRate, net_amount: l.netAmount, iva_amount: l.ivaAmount,
      })));
      if (linesErr) throw linesErr;
      toast({ title: `Borrador de ${VOUCHER_LABELS[voucher]} creado`, description: "La venta original no se modificó." });
      setSaleId("");
      load();
    } catch (e) {
      toast({ title: "No se pudo preparar la factura", description: e instanceof Error && !("code" in e) ? e.message : friendlyError(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeDraft = async (id: string) => {
    const { error } = await supabase.from("fiscal_invoices").delete().eq("id", id);
    if (error) return toast({ title: "No se pudo borrar", description: friendlyError(error), variant: "destructive" });
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>Modo <strong>homologación (pruebas)</strong>. La conexión con ARCA todavía no está activa: podés cargar tus datos fiscales y preparar borradores desde tus ventas, pero no se emiten comprobantes reales hasta conectar el servicio fiscal y tu certificado.</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Datos fiscales</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5"><Label>CUIT</Label><Input inputMode="numeric" value={settings.cuit} onChange={(e) => setSettings({ ...settings, cuit: e.target.value })} placeholder="20-12345678-6" /></div>
          <div className="space-y-1.5"><Label>Razón social</Label><Input value={settings.legal_name} onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Condición IVA</Label>
            <Select value={settings.iva_condition} onValueChange={(v) => setSettings({ ...settings, iva_condition: v as IvaCondition })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="responsable_inscripto">Responsable inscripto</SelectItem>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Domicilio fiscal</Label><Input value={settings.fiscal_address} onChange={(e) => setSettings({ ...settings, fiscal_address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Inicio de actividades</Label><Input type="date" value={settings.activity_start} onChange={(e) => setSettings({ ...settings, activity_start: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Ingresos Brutos</Label><Input value={settings.iibb} onChange={(e) => setSettings({ ...settings, iibb: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Punto de venta</Label><Input type="number" min={1} value={settings.sales_point} onChange={(e) => setSettings({ ...settings, sales_point: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Conexión ARCA</Label><div className="flex h-10 items-center"><Badge variant="secondary">{settings.connection_status === "connected" ? "Conectado" : "Sin conectar"}</Badge></div></div>
        </div>
        <Button onClick={saveSettings} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar datos fiscales</Button>
        <p className="text-xs text-muted-foreground">Solo los administradores pueden cambiar estos datos.</p>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="font-display text-xl">Facturar una venta</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1"><Label>Venta</Label>
            <Select value={saleId} onValueChange={setSaleId}>
              <SelectTrigger><SelectValue placeholder="Elegí una venta" /></SelectTrigger>
              <SelectContent>
                {sales.filter((s) => !invoicedSales.has(s.id)).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.sale_date} · {s.customers?.name ?? "Consumidor final"} · {money(s.total)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Condición del cliente</Label>
            <Select value={receiver} onValueChange={(v) => setReceiver(v as ReceiverCondition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="consumidor_final">Consumidor final</SelectItem>
                <SelectItem value="responsable_inscripto">Responsable inscripto</SelectItem>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Alícuota IVA</Label>
            <Select value={ivaRate} onValueChange={setIvaRate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["21", "10.5", "27", "5", "2.5", "0"].map((r) => <SelectItem key={r} value={r}>{r}%</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Tipo de comprobante: <strong>{VOUCHER_LABELS[voucherTypeFor(settings.iva_condition, receiver)]}</strong>. Facturar no cambia la venta, el stock ni la caja.</p>
        <Button onClick={createDraft} disabled={!saleId || saving || !hasSettings}><FileText className="mr-2 h-4 w-4" />Preparar borrador</Button>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="font-display text-xl">Comprobantes</h2>
        {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay comprobantes.</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Neto</TableHead><TableHead className="text-right">IVA</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>{VOUCHER_LABELS[inv.voucher_type]}{inv.number ? ` N° ${inv.number}` : ""}</TableCell>
                    <TableCell>{inv.receiver_name}</TableCell>
                    <TableCell className="text-right">{money(inv.net_amount)}</TableCell>
                    <TableCell className="text-right">{money(inv.iva_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{money(inv.total)}</TableCell>
                    <TableCell><Badge variant={inv.status === "authorized" ? "default" : "secondary"}>{STATUS_LABELS[inv.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      {inv.status === "draft" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled title="Requiere conexión con ARCA">Emitir</Button>
                          <Button size="icon" variant="ghost" aria-label="Borrar borrador" onClick={() => removeDraft(inv.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
