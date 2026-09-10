import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Ban, Printer, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePos, PAYMENT_METHODS, payLabel, fmtARS, type PaymentSplit } from "@/hooks/usePos";
import { useAuth } from "@/contexts/AuthContext";
import { printTicket } from "@/lib/ticket";
import { friendlyError } from "@/lib/errors";
import { toast } from "sonner";

export type PosSaleRow = {
  id: string;
  reference: string | null;
  status: string;
  created_at: string;
  total: number;
  discount: number;
  tax: number | null;
  payment_method: string | null;
  payments: PaymentSplit[];
  amount_received: number | null;
  change_amount: number | null;
  created_by: string | null;
  seller: string;
  customer_name: string | null;
  items: { name: string; quantity: number; unit_price: number }[];
};

export function usePosSales() {
  const [rows, setRows] = useState<PosSaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: sales, error }, { data: items }, { data: users }] = await Promise.all([
      supabase.from("sales").select("*, customers(name)").eq("source", "pos").order("created_at", { ascending: false }).limit(300),
      supabase.from("sale_items").select("sale_id, description, quantity, unit_price, products(name)"),
      supabase.from("users").select("id, email"),
    ]);
    if (error) toast.error(friendlyError(error, "Error al cargar ventas"));
    const userMap = new Map((users ?? []).map((u: { id: string; email: string }) => [u.id, u.email]));
    const itemMap = new Map<string, { name: string; quantity: number; unit_price: number }[]>();
    (items ?? []).forEach((it: any) => {
      const arr = itemMap.get(it.sale_id) ?? [];
      arr.push({ name: it.products?.name ?? it.description ?? "Producto", quantity: Number(it.quantity), unit_price: Number(it.unit_price) });
      itemMap.set(it.sale_id, arr);
    });
    setRows(
      (sales ?? []).map((s: any) => ({
        ...s,
        payments: Array.isArray(s.payments) ? s.payments : [],
        seller: userMap.get(s.created_by ?? "") ?? "—",
        customer_name: s.customers?.name ?? null,
        items: itemMap.get(s.id) ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { rows, loading, reload: load };
}

export function PosHistory({ rows, loading, reload }: { rows: PosSaleRow[]; loading: boolean; reload: () => void }) {
  const { annulSale } = usePos();
  const { company } = useAuth();
  const [search, setSearch] = useState("");
  const [pay, setPay] = useState("all");
  const [seller, setSeller] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const sellers = useMemo(() => Array.from(new Set(rows.map((r) => r.seller))), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (pay !== "all" && r.payment_method !== pay) return false;
        if (seller !== "all" && r.seller !== seller) return false;
        const d = r.created_at.slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.reference?.toLowerCase().includes(q) ||
            r.customer_name?.toLowerCase().includes(q) ||
            r.items.some((i) => i.name.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [rows, search, pay, seller, from, to]
  );

  const annul = async (r: PosSaleRow) => {
    if (r.status === "anulada") return;
    if (!confirm("¿Anular la venta y reponer el stock de los productos?")) return;
    const res = await annulSale(r.id);
    if (!res.error) reload();
  };

  const reprint = (r: PosSaleRow) => {
    const subtotal = r.items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
    printTicket({
      company: company?.name ?? "OneStock",
      seller: r.seller,
      customer: r.customer_name,
      date: new Date(r.created_at),
      reference: r.reference,
      lines: r.items,
      subtotal,
      discount: Number(r.discount || 0),
      tax: Number(r.tax || 0),
      total: Number(r.total),
      payments: r.payments,
      received: r.amount_received,
      change: r.change_amount,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por ticket, cliente o producto…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={pay} onValueChange={setPay}>
          <SelectTrigger><SelectValue placeholder="Medio de pago" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pagos</SelectItem>
            <SelectItem value="mixto">Mixto</SelectItem>
            {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={seller} onValueChange={setSeller}>
          <SelectTrigger><SelectValue placeholder="Vendedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {sellers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Todavía no hay ventas registradas en la caja.</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead><TableHead>Fecha</TableHead><TableHead>Vendedor</TableHead>
                  <TableHead>Cliente</TableHead><TableHead>Pago</TableHead><TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={r.status === "anulada" ? "opacity-60" : ""}>
                    <TableCell className="font-medium">
                      {r.reference ?? r.id.slice(0, 8)}
                      {r.status === "anulada" && <Badge variant="destructive" className="ml-2 text-[10px]">Anulada</Badge>}
                      <div className="text-xs text-muted-foreground">{r.items.length} ítem(s)</div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("es-AR")}</TableCell>
                    <TableCell className="text-xs">{r.seller}</TableCell>
                    <TableCell className="text-xs">{r.customer_name ?? "Consumidor final"}</TableCell>
                    <TableCell><Badge variant="outline">{payLabel(r.payment_method)}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{fmtARS(Number(r.total))}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => reprint(r)}><Printer className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" disabled={r.status === "anulada"} onClick={() => annul(r)}>
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {filtered.map((r) => (
              <div key={r.id} className={`rounded-xl border border-border bg-card p-3 shadow-card ${r.status === "anulada" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.reference ?? r.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("es-AR")}</p>
                  </div>
                  <span className="text-base font-bold text-primary">{fmtARS(Number(r.total))}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge variant="outline">{payLabel(r.payment_method)}</Badge>
                  <Badge variant="secondary">{r.seller}</Badge>
                  {r.status === "anulada" && <Badge variant="destructive">Anulada</Badge>}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => reprint(r)}><Printer className="h-3.5 w-3.5" /> Ticket</Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive" disabled={r.status === "anulada"} onClick={() => annul(r)}>
                    <Ban className="h-3.5 w-3.5" /> Anular
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
