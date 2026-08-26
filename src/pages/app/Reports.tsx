import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, Search, BarChart3, BookOpen, Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements, type MovementWithProduct } from "@/hooks/useStockMovements";
import { exportToCsv, exportToPdf, formatARS, type ExportColumn } from "@/lib/exporters";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR");

type KardexRow = MovementWithProduct & { balance: number };

function ExportButtons({ onCsv, onPdf }: { onCsv: () => void; onPdf: () => void }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onCsv}>
        <FileSpreadsheet className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Excel</span>
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onPdf}>
        <FileDown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  );
}

export default function Reports() {
  const { products, loading: loadingProducts } = useProducts();
  const { movements, loading: loadingMovements } = useStockMovements();
  const [productId, setProductId] = useState<string>("");
  const [search, setSearch] = useState("");

  /* ---------- Kardex ---------- */
  const kardex = useMemo<KardexRow[]>(() => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    const list = movements
      .filter((m) => m.product_id === productId)
      .slice()
      .sort((a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime());
    // Reconstruimos el saldo desde el stock actual hacia atrás.
    const totalDelta = list.reduce((acc, m) => acc + (m.type === "entrada" ? m.quantity : -m.quantity), 0);
    let balance = (product?.current_stock ?? 0) - totalDelta;
    return list.map((m) => {
      balance += m.type === "entrada" ? m.quantity : -m.quantity;
      return { ...m, balance };
    });
  }, [productId, movements, products]);

  const kardexColumns: ExportColumn<KardexRow>[] = [
    { header: "Fecha", value: (r) => fmtDate(r.movement_date) },
    { header: "Tipo", value: (r) => (r.type === "entrada" ? "Entrada" : "Salida") },
    { header: "Cantidad", value: (r) => (r.type === "entrada" ? r.quantity : -r.quantity) },
    { header: "Saldo", value: (r) => r.balance },
    { header: "Motivo", value: (r) => r.reason ?? "" },
    { header: "Valor", value: (r) => r.value.toFixed(2) },
  ];

  /* ---------- Valorización ---------- */
  const valuationRows = useMemo(
    () =>
      products
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
        .map((p) => {
          const cost = Number(p.cost ?? 0);
          const sale = Number(p.price_retail ?? p.price ?? 0);
          return {
            ...p,
            costTotal: cost * p.current_stock,
            saleTotal: sale * p.current_stock,
            margin: cost > 0 && sale > 0 ? ((sale - cost) / cost) * 100 : 0,
          };
        }),
    [products, search]
  );

  const valuationTotal = valuationRows.reduce((a, r) => a + r.costTotal, 0);
  const valuationSaleTotal = valuationRows.reduce((a, r) => a + r.saleTotal, 0);

  const valuationColumns: ExportColumn<(typeof valuationRows)[number]>[] = [
    { header: "Producto", value: (r) => r.name },
    { header: "SKU", value: (r) => r.sku ?? "" },
    { header: "Categoría", value: (r) => r.category ?? "" },
    { header: "Stock", value: (r) => r.current_stock },
    { header: "Costo unit.", value: (r) => Number(r.cost ?? 0).toFixed(2) },
    { header: "Valor costo", value: (r) => r.costTotal.toFixed(2) },
    { header: "Valor venta", value: (r) => r.saleTotal.toFixed(2) },
    { header: "Margen %", value: (r) => r.margin.toFixed(1) },
  ];

  /* ---------- Movimientos ---------- */
  const movementColumns: ExportColumn<MovementWithProduct>[] = [
    { header: "Fecha", value: (r) => fmtDate(r.movement_date) },
    { header: "Producto", value: (r) => r.product_name },
    { header: "SKU", value: (r) => r.product_sku ?? "" },
    { header: "Tipo", value: (r) => (r.type === "entrada" ? "Entrada" : "Salida") },
    { header: "Cantidad", value: (r) => r.quantity },
    { header: "Motivo", value: (r) => r.reason ?? "" },
    { header: "Valor", value: (r) => r.value.toFixed(2) },
  ];

  const loading = loadingProducts || loadingMovements;
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">Reportes</h2>
        <p className="text-sm text-muted-foreground">Kardex, valorización y exportación a Excel o PDF</p>
      </div>

      <Tabs defaultValue="kardex" className="w-full">
        <TabsList className="mb-4 flex w-full gap-1 overflow-x-auto whitespace-nowrap md:w-auto md:inline-flex">
          <TabsTrigger value="kardex" className="gap-1.5 px-3 text-xs md:text-sm"><BookOpen className="h-3.5 w-3.5" />Kardex</TabsTrigger>
          <TabsTrigger value="valuation" className="gap-1.5 px-3 text-xs md:text-sm"><Boxes className="h-3.5 w-3.5" />Valorización</TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5 px-3 text-xs md:text-sm"><BarChart3 className="h-3.5 w-3.5" />Movimientos</TabsTrigger>
        </TabsList>

        {/* Kardex */}
        <TabsContent value="kardex" className="mt-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-full sm:max-w-xs" aria-label="Elegir producto">
                <SelectValue placeholder="Elegí un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.sku ? `· ${p.sku}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productId && (
              <ExportButtons
                onCsv={() => exportToCsv(`kardex-${selectedProduct?.name ?? "producto"}`, kardexColumns, kardex)}
                onPdf={() => exportToPdf(`Kardex — ${selectedProduct?.name ?? ""}`, kardexColumns, kardex)}
              />
            )}
          </div>

          {!productId ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Seleccioná un producto para ver su historial completo de movimientos.
            </div>
          ) : kardex.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              Este producto todavía no registra movimientos.
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="space-y-2 md:hidden">
                {kardex.slice().reverse().map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                    <div className="flex items-center justify-between">
                      <Badge variant={r.type === "entrada" ? "default" : "secondary"} className="text-[10px]">
                        {r.type === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{fmtDate(r.movement_date)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className={r.type === "entrada" ? "font-semibold text-success" : "font-semibold text-destructive"}>
                        {r.type === "entrada" ? "+" : "−"}{r.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">Saldo: <b className="text-foreground">{r.balance}</b></span>
                    </div>
                    {r.reason && <p className="mt-1 truncate text-xs text-muted-foreground">{r.reason}</p>}
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                      <th className="px-4 py-2 text-right font-medium">Saldo</th>
                      <th className="px-4 py-2 text-left font-medium">Motivo</th>
                      <th className="px-4 py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {kardex.slice().reverse().map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2">{fmtDate(r.movement_date)}</td>
                        <td className="px-4 py-2">
                          <Badge variant={r.type === "entrada" ? "default" : "secondary"} className="text-[10px]">
                            {r.type === "entrada" ? "Entrada" : "Salida"}
                          </Badge>
                        </td>
                        <td className={`px-4 py-2 text-right font-medium ${r.type === "entrada" ? "text-success" : "text-destructive"}`}>
                          {r.type === "entrada" ? "+" : "−"}{r.quantity}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">{r.balance}</td>
                        <td className="max-w-[240px] truncate px-4 py-2 text-muted-foreground">{r.reason ?? "—"}</td>
                        <td className="px-4 py-2 text-right">{formatARS(r.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Valorización */}
        <TabsContent value="valuation" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Valor a costo</p>
              <p className="mt-1 text-lg font-bold">{formatARS(valuationTotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Valor a venta</p>
              <p className="mt-1 text-lg font-bold text-success">{formatARS(valuationSaleTotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Ganancia potencial</p>
              <p className="mt-1 text-lg font-bold text-primary">{formatARS(valuationSaleTotal - valuationTotal)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar producto"
                placeholder="Buscar producto o SKU"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ExportButtons
              onCsv={() => exportToCsv("valorizacion-inventario", valuationColumns, valuationRows)}
              onPdf={() => exportToPdf("Valorización de inventario", valuationColumns, valuationRows)}
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {valuationRows.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.sku ?? "Sin SKU"} · {r.current_stock} u.</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>Costo: <b>{formatARS(r.costTotal)}</b></span>
                  <span className="text-success">Venta: <b>{formatARS(r.saleTotal)}</b></span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Producto</th>
                  <th className="px-4 py-2 text-left font-medium">SKU</th>
                  <th className="px-4 py-2 text-right font-medium">Stock</th>
                  <th className="px-4 py-2 text-right font-medium">Valor costo</th>
                  <th className="px-4 py-2 text-right font-medium">Valor venta</th>
                  <th className="px-4 py-2 text-right font-medium">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {valuationRows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-[240px] truncate px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.sku ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{r.current_stock}</td>
                    <td className="px-4 py-2 text-right">{formatARS(r.costTotal)}</td>
                    <td className="px-4 py-2 text-right text-success">{formatARS(r.saleTotal)}</td>
                    <td className="px-4 py-2 text-right">{r.margin > 0 ? `${r.margin.toFixed(0)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Movimientos */}
        <TabsContent value="movements" className="mt-0 space-y-4">
          <div className="flex justify-end">
            <ExportButtons
              onCsv={() => exportToCsv("movimientos", movementColumns, movements)}
              onPdf={() => exportToPdf("Reporte de movimientos", movementColumns, movements)}
            />
          </div>
          <div className="space-y-2 md:hidden">
            {movements.slice(0, 50).map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{m.product_name}</p>
                  <span className={`text-sm font-semibold ${m.type === "entrada" ? "text-success" : "text-destructive"}`}>
                    {m.type === "entrada" ? "+" : "−"}{m.quantity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{fmtDate(m.movement_date)} · {formatARS(m.value)}</p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Producto</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.slice(0, 100).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2">{fmtDate(m.movement_date)}</td>
                    <td className="max-w-[240px] truncate px-4 py-2 font-medium">{m.product_name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={m.type === "entrada" ? "default" : "secondary"} className="text-[10px]">
                        {m.type === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">{m.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatARS(m.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
