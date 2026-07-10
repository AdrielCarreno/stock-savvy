import { useEffect, useMemo, useState } from "react";
import { Calculator, Plus, Trash2, Loader2, BookOpen, FileText, Scale, TrendingUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

type AccountType = "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto";
type Account = { id: string; code: string; name: string; type: AccountType; parent_id: string | null; is_active: boolean };
type JournalLine = { id: string; entry_id: string; account_id: string; debit: number; credit: number };
type JournalEntry = { id: string; entry_number: number; entry_date: string; description: string; created_at: string };

const TYPE_LABEL: Record<AccountType, string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio Neto",
  ingreso: "Ingreso",
  gasto: "Gasto",
};
const TYPE_COLOR: Record<AccountType, string> = {
  activo: "bg-success-light text-success border-success/20",
  pasivo: "bg-destructive/10 text-destructive border-destructive/20",
  patrimonio: "bg-primary-light text-primary border-primary/20",
  ingreso: "bg-success-light text-success border-success/20",
  gasto: "bg-warning-light text-warning border-warning/20",
};

// Standard chart of accounts seed (simplified, in Spanish/Argentine terms).
const DEFAULT_ACCOUNTS: Array<Omit<Account, "id" | "is_active" | "parent_id"> & { parent_code?: string }> = [
  { code: "1", name: "Activo", type: "activo" },
  { code: "1.1", name: "Caja", type: "activo", parent_code: "1" },
  { code: "1.2", name: "Banco", type: "activo", parent_code: "1" },
  { code: "1.3", name: "Clientes / Cuentas a cobrar", type: "activo", parent_code: "1" },
  { code: "1.4", name: "Mercaderías", type: "activo", parent_code: "1" },
  { code: "2", name: "Pasivo", type: "pasivo" },
  { code: "2.1", name: "Proveedores", type: "pasivo", parent_code: "2" },
  { code: "2.2", name: "Deudas fiscales", type: "pasivo", parent_code: "2" },
  { code: "3", name: "Patrimonio Neto", type: "patrimonio" },
  { code: "3.1", name: "Capital", type: "patrimonio", parent_code: "3" },
  { code: "3.2", name: "Resultados acumulados", type: "patrimonio", parent_code: "3" },
  { code: "4", name: "Ingresos", type: "ingreso" },
  { code: "4.1", name: "Ventas", type: "ingreso", parent_code: "4" },
  { code: "5", name: "Gastos", type: "gasto" },
  { code: "5.1", name: "Costo de mercadería vendida", type: "gasto", parent_code: "5" },
  { code: "5.2", name: "Gastos operativos", type: "gasto", parent_code: "5" },
  { code: "5.3", name: "Sueldos y jornales", type: "gasto", parent_code: "5" },
];

const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function Accounting() {
  const { company } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const [a, e, l] = await Promise.all([
      (supabase as any).from("accounts").select("*").order("code"),
      (supabase as any).from("journal_entries").select("*").order("entry_date", { ascending: false }).order("entry_number", { ascending: false }),
      (supabase as any).from("journal_lines").select("*"),
    ]);
    setAccounts((a.data ?? []) as Account[]);
    setEntries((e.data ?? []) as JournalEntry[]);
    setLines((l.data ?? []) as JournalLine[]);
    setLoading(false);
  };

  const seedDefaults = async () => {
    if (!company?.id) return;
    setSeeding(true);
    // Insert parents first, then children with parent_id resolved.
    const parents = DEFAULT_ACCOUNTS.filter((a) => !a.parent_code);
    const { data: parentData, error: pErr } = await (supabase as any)
      .from("accounts")
      .insert(parents.map((p) => ({ company_id: company.id, code: p.code, name: p.name, type: p.type })))
      .select("id, code");
    if (pErr) { setSeeding(false); toast({ title: "Error", description: friendlyError(pErr), variant: "destructive" }); return; }
    const byCode = new Map<string, string>();
    (parentData ?? []).forEach((r: any) => byCode.set(r.code, r.id));
    const children = DEFAULT_ACCOUNTS.filter((a) => a.parent_code).map((a) => ({
      company_id: company.id, code: a.code, name: a.name, type: a.type, parent_id: byCode.get(a.parent_code!) ?? null,
    }));
    const { error: cErr } = await (supabase as any).from("accounts").insert(children);
    setSeeding(false);
    if (cErr) return toast({ title: "Error", description: friendlyError(cErr), variant: "destructive" });
    toast({ title: "Plan de cuentas inicial creado" });
    load();
  };

  useEffect(() => { load(); }, [company?.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Contabilidad</h2>
          <p className="text-sm text-muted-foreground">Plan de cuentas, libro diario, mayor, balance y estado de resultados (partida doble).</p>
        </div>
        {!loading && accounts.length === 0 && (
          <Button onClick={seedDefaults} disabled={seeding} className="gap-2 gradient-primary shadow-primary text-primary-foreground">
            {seeding && <Loader2 className="h-4 w-4 animate-spin" />}Crear plan de cuentas inicial
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Todavía no tenés cuentas contables. Creá el plan inicial para empezar a registrar asientos.</p>
        </div>
      ) : (
        <Tabs defaultValue="chart">
          <TabsList className="mb-4 grid w-full grid-cols-5 gap-1 h-auto md:w-auto md:inline-flex">
            <TabsTrigger value="chart" className="text-[10px] md:text-sm px-1 md:px-3 leading-tight">Plan</TabsTrigger>
            <TabsTrigger value="journal" className="text-[10px] md:text-sm px-1 md:px-3 leading-tight">Diario</TabsTrigger>
            <TabsTrigger value="ledger" className="text-[10px] md:text-sm px-1 md:px-3 leading-tight">Mayor</TabsTrigger>
            <TabsTrigger value="balance" className="text-[10px] md:text-sm px-1 md:px-3 leading-tight">Balance</TabsTrigger>
            <TabsTrigger value="income" className="text-[10px] md:text-sm px-1 md:px-3 leading-tight">Resultados</TabsTrigger>
          </TabsList>
          <TabsContent value="chart"><ChartOfAccountsView accounts={accounts} onReload={load} companyId={company!.id} /></TabsContent>
          <TabsContent value="journal"><JournalView accounts={accounts} entries={entries} lines={lines} onReload={load} companyId={company!.id} /></TabsContent>
          <TabsContent value="ledger"><LedgerView accounts={accounts} entries={entries} lines={lines} /></TabsContent>
          <TabsContent value="balance"><BalanceView accounts={accounts} lines={lines} /></TabsContent>
          <TabsContent value="income"><IncomeView accounts={accounts} lines={lines} entries={entries} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ================= Plan de Cuentas ================= */
function ChartOfAccountsView({ accounts, onReload, companyId }: { accounts: Account[]; onReload: () => void; companyId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ id?: string; code: string; name: string; type: AccountType; parent_id: string | null }>({ code: "", name: "", type: "activo", parent_id: null });

  const reset = () => setForm({ code: "", name: "", type: "activo", parent_id: null });
  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (a: Account) => { setForm({ id: a.id, code: a.code, name: a.name, type: a.type, parent_id: a.parent_id }); setOpen(true); };

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) return toast({ title: "Código y nombre son obligatorios", variant: "destructive" });
    const payload = { company_id: companyId, code: form.code.trim(), name: form.name.trim(), type: form.type, parent_id: form.parent_id || null };
    const { error } = form.id
      ? await (supabase as any).from("accounts").update(payload).eq("id", form.id)
      : await (supabase as any).from("accounts").insert(payload);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    setOpen(false); reset(); onReload();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar la cuenta? No podés eliminarla si tiene movimientos asociados.")) return;
    const { error } = await (supabase as any).from("accounts").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{accounts.length} cuentas</p>
        <Button onClick={openNew} size="sm" className="gap-2"><Plus className="h-4 w-4" />Nueva cuenta</Button>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-24">Código</TableHead><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Acciones</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                <TableCell className={a.parent_id ? "pl-8" : "font-semibold"}>{a.name}</TableCell>
                <TableCell><Badge className={`text-[10px] ${TYPE_COLOR[a.type]}`}>{TYPE_LABEL[a.type]}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Plus className="h-4 w-4 rotate-45" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{form.id ? "Editar" : "Nueva"} cuenta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1.5" /></div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AccountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Cuenta padre (opcional)</Label>
              <Select value={form.parent_id ?? "__none"} onValueChange={(v) => setForm({ ...form, parent_id: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Sin padre" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sin padre</SelectItem>
                  {accounts.filter((a) => a.type === form.type && a.id !== form.id).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

/* ================= Libro Diario ================= */
type LineDraft = { account_id: string; debit: number; credit: number };
function JournalView({ accounts, entries, lines, onReload, companyId }: { accounts: Account[]; entries: JournalEntry[]; lines: JournalLine[]; onReload: () => void; companyId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [draftLines, setDraftLines] = useState<LineDraft[]>([{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }]);
  const [saving, setSaving] = useState(false);

  const totalDebit = draftLines.reduce((a, l) => a + (Number(l.debit) || 0), 0);
  const totalCredit = draftLines.reduce((a, l) => a + (Number(l.credit) || 0), 0);
  const balanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005;

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const linesByEntry = useMemo(() => {
    const map = new Map<string, JournalLine[]>();
    lines.forEach((l) => { const arr = map.get(l.entry_id) ?? []; arr.push(l); map.set(l.entry_id, arr); });
    return map;
  }, [lines]);

  const reset = () => {
    setDescription(""); setEntryDate(new Date().toISOString().slice(0, 10));
    setDraftLines([{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }]);
  };

  const updateDraft = (i: number, patch: Partial<LineDraft>) => setDraftLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLine = () => setDraftLines((prev) => [...prev, { account_id: "", debit: 0, credit: 0 }]);
  const removeLine = (i: number) => setDraftLines((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!description.trim()) return toast({ title: "La descripción es obligatoria", variant: "destructive" });
    const valid = draftLines.filter((l) => l.account_id && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
    if (valid.length < 2) return toast({ title: "Necesitás al menos 2 líneas con importe", variant: "destructive" });
    if (!balanced) return toast({ title: "El asiento no balancea", description: `Débito ${fmt(totalDebit)} ≠ Haber ${fmt(totalCredit)}`, variant: "destructive" });
    for (const l of valid) {
      const hasD = Number(l.debit) > 0, hasC = Number(l.credit) > 0;
      if (hasD && hasC) return toast({ title: "Cada línea sólo puede tener débito o haber", variant: "destructive" });
    }
    setSaving(true);
    const { data, error } = await (supabase as any).from("journal_entries").insert({
      company_id: companyId, entry_date: entryDate, description: description.trim(),
    }).select("id").maybeSingle();
    if (error || !data) { setSaving(false); return toast({ title: "Error", description: friendlyError(error), variant: "destructive" }); }
    const rows = valid.map((l) => ({ company_id: companyId, entry_id: data.id, account_id: l.account_id, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 }));
    const { error: lErr } = await (supabase as any).from("journal_lines").insert(rows);
    setSaving(false);
    if (lErr) { await (supabase as any).from("journal_entries").delete().eq("id", data.id); return toast({ title: "Error en líneas", description: friendlyError(lErr), variant: "destructive" }); }
    toast({ title: "Asiento registrado" });
    setOpen(false); reset(); onReload();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar el asiento?")) return;
    const { error } = await (supabase as any).from("journal_entries").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: friendlyError(error), variant: "destructive" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{entries.length} asientos</p>
        <Button onClick={() => { reset(); setOpen(true); }} size="sm" className="gap-2"><Plus className="h-4 w-4" />Nuevo asiento</Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card">
        {entries.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Todavía no registraste asientos.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-16">N°</TableHead><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead>
              <TableHead>Cuentas</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {entries.map((e) => {
                const ls = linesByEntry.get(e.id) ?? [];
                const total = ls.reduce((a, l) => a + Number(l.debit), 0);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.entry_number}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(e.entry_date).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        {ls.map((l) => {
                          const a = accountById.get(l.account_id);
                          return (
                            <div key={l.id} className={l.debit > 0 ? "" : "pl-4"}>
                              <span className="font-mono text-muted-foreground">{a?.code}</span> {a?.name} — <span className="font-medium">{fmt(Number(l.debit) || Number(l.credit))}</span> <span className="text-muted-foreground">({l.debit > 0 ? "D" : "H"})</span>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(total)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo asiento contable</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Fecha *</Label><Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} /></div>
              <div className="col-span-2"><Label>Descripción *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Venta a cliente XYZ" /></div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <Label>Líneas del asiento</Label>
                <Button size="sm" variant="outline" onClick={addLine} className="h-7 gap-1 text-xs"><Plus className="h-3 w-3" />Agregar línea</Button>
              </div>
              <div className="space-y-2">
                {draftLines.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Select value={l.account_id} onValueChange={(v) => updateDraft(i, { account_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Cuenta" /></SelectTrigger>
                        <SelectContent>{accounts.filter((a) => a.is_active).map((a) => (
                          <SelectItem key={a.id} value={a.id}><span className="font-mono text-xs mr-2">{a.code}</span>{a.name}</SelectItem>
                        ))}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Input type="number" step="0.01" min={0} placeholder="Débito" value={l.debit || ""} onChange={(e) => updateDraft(i, { debit: Number(e.target.value) || 0, credit: 0 })} /></div>
                    <div className="col-span-2"><Input type="number" step="0.01" min={0} placeholder="Haber" value={l.credit || ""} onChange={(e) => updateDraft(i, { credit: Number(e.target.value) || 0, debit: 0 })} /></div>
                    <div className="col-span-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeLine(i)} disabled={draftLines.length <= 2}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`mt-3 flex justify-end gap-6 text-sm rounded-lg border p-3 ${balanced ? "border-success bg-success-light" : "border-border bg-muted/30"}`}>
                <div>Débito total: <span className="font-bold">{fmt(totalDebit)}</span></div>
                <div>Haber total: <span className="font-bold">{fmt(totalCredit)}</span></div>
                <div className={balanced ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {balanced ? "Balanceado ✓" : `Diferencia: ${fmt(totalDebit - totalCredit)}`}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={submit} disabled={saving || !balanced}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Registrar asiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= Libro Mayor ================= */
function LedgerView({ accounts, entries, lines }: { accounts: Account[]; entries: JournalEntry[]; lines: JournalLine[] }) {
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const rows = useMemo(() => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return [];
    const filtered = lines.filter((l) => l.account_id === accountId).map((l) => ({ ...l, entry: entryById.get(l.entry_id)! })).filter((r) => r.entry)
      .sort((a, b) => new Date(a.entry.entry_date).getTime() - new Date(b.entry.entry_date).getTime());
    let saldo = 0;
    const sign = (acc.type === "activo" || acc.type === "gasto") ? 1 : -1;
    return filtered.map((r) => {
      saldo += sign * (Number(r.debit) - Number(r.credit));
      return { ...r, saldo };
    });
  }, [accountId, lines, entries, accounts, entryById]);

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <Label>Cuenta</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar cuenta" /></SelectTrigger>
          <SelectContent>{accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}><span className="font-mono text-xs mr-2">{a.code}</span>{a.name}</SelectItem>
          ))}</SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-card">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Sin movimientos para esta cuenta.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fecha</TableHead><TableHead className="w-16">N°</TableHead><TableHead>Descripción</TableHead>
              <TableHead className="text-right">Débito</TableHead><TableHead className="text-right">Haber</TableHead><TableHead className="text-right">Saldo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.entry.entry_date).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell className="font-mono text-xs">{r.entry.entry_number}</TableCell>
                  <TableCell>{r.entry.description}</TableCell>
                  <TableCell className="text-right">{r.debit > 0 ? fmt(Number(r.debit)) : "-"}</TableCell>
                  <TableCell className="text-right">{r.credit > 0 ? fmt(Number(r.credit)) : "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(r.saldo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

/* ================= Balance ================= */
function accountBalances(accounts: Account[], lines: JournalLine[]) {
  const bal = new Map<string, number>();
  accounts.forEach((a) => bal.set(a.id, 0));
  lines.forEach((l) => bal.set(l.account_id, (bal.get(l.account_id) ?? 0) + Number(l.debit) - Number(l.credit)));
  const byType = { activo: 0, pasivo: 0, patrimonio: 0, ingreso: 0, gasto: 0 };
  const accountList: Array<{ a: Account; saldo: number }> = [];
  accounts.forEach((a) => {
    const raw = bal.get(a.id) ?? 0;
    const sign = (a.type === "activo" || a.type === "gasto") ? 1 : -1;
    const saldo = sign * raw;
    byType[a.type] += saldo;
    accountList.push({ a, saldo });
  });
  return { byType, accountList };
}

function BalanceView({ accounts, lines }: { accounts: Account[]; lines: JournalLine[] }) {
  const { byType, accountList } = useMemo(() => accountBalances(accounts, lines), [accounts, lines]);
  const resultado = byType.ingreso - byType.gasto;
  const pnTotal = byType.patrimonio + resultado;
  const cuadre = byType.activo - (byType.pasivo + pnTotal);

  const section = (title: string, type: AccountType, total: number) => (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="font-bold">{fmt(total)}</span>
      </div>
      <div className="space-y-1 text-sm">
        {accountList.filter((r) => r.a.type === type).map((r) => (
          <div key={r.a.id} className="flex justify-between py-1 border-b border-border/50 last:border-0">
            <span><span className="font-mono text-xs text-muted-foreground mr-2">{r.a.code}</span>{r.a.name}</span>
            <span>{fmt(r.saldo)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {section("Activo", "activo", byType.activo)}
        {section("Pasivo", "pasivo", byType.pasivo)}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">Patrimonio Neto</h3>
            <span className="font-bold">{fmt(pnTotal)}</span>
          </div>
          <div className="space-y-1 text-sm">
            {accountList.filter((r) => r.a.type === "patrimonio").map((r) => (
              <div key={r.a.id} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                <span><span className="font-mono text-xs text-muted-foreground mr-2">{r.a.code}</span>{r.a.name}</span>
                <span>{fmt(r.saldo)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1 italic text-muted-foreground">
              <span>Resultado del ejercicio</span><span>{fmt(resultado)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`rounded-lg border p-4 text-sm flex items-center gap-3 ${Math.abs(cuadre) < 0.01 ? "border-success bg-success-light text-success" : "border-destructive bg-destructive/10 text-destructive"}`}>
        <Scale className="h-4 w-4" />
        <span>
          Activo ({fmt(byType.activo)}) = Pasivo ({fmt(byType.pasivo)}) + PN ({fmt(pnTotal)}){" "}
          <span className="font-semibold">
            {Math.abs(cuadre) < 0.01 ? "— balance cuadrado ✓" : `— diferencia ${fmt(cuadre)}`}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ================= Estado de Resultados ================= */
function IncomeView({ accounts, lines, entries }: { accounts: Account[]; lines: JournalLine[]; entries: JournalEntry[] }) {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filteredLines = useMemo(() => {
    const entryDates = new Map(entries.map((e) => [e.id, e.entry_date]));
    return lines.filter((l) => {
      const d = entryDates.get(l.entry_id);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [lines, entries, from, to]);

  const { byType, accountList } = useMemo(() => accountBalances(accounts, filteredLines), [accounts, filteredLines]);
  const resultado = byType.ingreso - byType.gasto;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div><Label>Desde</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>Hasta</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4 max-w-2xl">
        <div>
          <div className="flex justify-between border-b border-border pb-2 mb-2">
            <h3 className="text-sm font-semibold">Ingresos</h3>
            <span className="font-bold text-success">{fmt(byType.ingreso)}</span>
          </div>
          {accountList.filter((r) => r.a.type === "ingreso").map((r) => (
            <div key={r.a.id} className="flex justify-between text-sm py-1"><span>{r.a.name}</span><span>{fmt(r.saldo)}</span></div>
          ))}
        </div>
        <div>
          <div className="flex justify-between border-b border-border pb-2 mb-2">
            <h3 className="text-sm font-semibold">Gastos</h3>
            <span className="font-bold text-destructive">{fmt(byType.gasto)}</span>
          </div>
          {accountList.filter((r) => r.a.type === "gasto").map((r) => (
            <div key={r.a.id} className="flex justify-between text-sm py-1"><span>{r.a.name}</span><span>{fmt(r.saldo)}</span></div>
          ))}
        </div>
        <div className={`flex justify-between items-center rounded-lg p-3 ${resultado >= 0 ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"}`}>
          <span className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" />Resultado del ejercicio</span>
          <span className="text-lg font-bold">{fmt(resultado)}</span>
        </div>
      </div>
    </div>
  );
}
