import { useMemo, useState } from "react";
import { Search, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStockMovements } from "@/hooks/useStockMovements";

// Read-only chronological feed of every stock movement (includes those generated
// by sales, purchases and manual adjustments).
export function AllMovementsPanel() {
  const { movements, loading } = useStockMovements();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => movements.filter((m: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.product_name?.toLowerCase().includes(q) || m.product_sku?.toLowerCase().includes(q) || m.reason?.toLowerCase().includes(q);
  }), [movements, search]);

  const fmt = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Todos los movimientos</h2>
        <p className="text-sm text-muted-foreground">Feed completo de movimientos de stock: compras, ventas y ajustes.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por producto, SKU o nota..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota / Origen</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando movimientos...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {movements.length === 0 ? "Aún no hay movimientos registrados." : "Sin resultados para la búsqueda."}
                </td></tr>
              ) : filtered.map((m: any) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{m.product_name}</td>
                  <td className="px-4 py-3">{m.product_sku ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{m.product_sku}</code> : <span className="text-muted-foreground text-xs">—</span>}</td>
                  <td className="px-4 py-3">
                    <Badge className={m.type === "entrada" ? "bg-success-light text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                      {m.type === "entrada" ? <><ArrowDownCircle className="mr-1 h-3 w-3" />Entrada</> : <><ArrowUpCircle className="mr-1 h-3 w-3" />Salida</>}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{m.quantity}</td>
                  <td className="px-4 py-3 text-right">{m.value > 0 ? fmt(m.value) : <span className="text-muted-foreground text-xs">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{fmtDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
