import { useMemo, useState } from "react";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Loader2, Download, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements, type MovementWithProduct } from "@/hooks/useStockMovements";
import { toast } from "sonner";

type SaleType = "mayorista" | "minorista";

export default function Movements() {
  const { products } = useProducts();
  const { movements, loading, createMovement, updateMovement } = useStockMovements();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MovementWithProduct | null>(null);
  const [form, setForm] = useState<{
    productId: string;
    type: "entrada" | "salida";
    quantity: number;
    note: string;
    saleType: SaleType;
    logistics: string;
    movementDate: string;
  }>({
    productId: "",
    type: "entrada",
    quantity: 1,
    note: "",
    saleType: "minorista",
    logistics: "",
    movementDate: new Date().toISOString().slice(0, 16),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const filtered = movements.filter((m) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return m.product_name.toLowerCase().includes(searchLower) ||
      (m.product_sku?.toLowerCase().includes(searchLower) ?? false);
  });

    

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let entradasHoy = 0, salidasHoy = 0, entradas7 = 0, salidas7 = 0;
    movements.forEach((m) => {
      const d = new Date(m.movement_date);
      if (d >= startOfDay) {
        if (m.type === "entrada") entradasHoy++;
        else salidasHoy++;
      }
      if (d >= sevenDaysAgo) {
        if (m.type === "entrada") entradas7++;
        else salidas7++;
      }
    });
    return { entradasHoy, salidasHoy, entradas7, salidas7 };
  }, [movements]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.productId) errs.productId = "Seleccioná un producto";
    if (form.quantity < 1) errs.quantity = "La cantidad debe ser mayor a 0";
    if (!form.movementDate) errs.movementDate = "Fecha requerida";
    return errs;
  };

  const resetForm = () =>
    setForm({
      productId: "",
      type: "entrada",
      quantity: 1,
      note: "",
      saleType: "minorista",
      logistics: "",
      movementDate: new Date().toISOString().slice(0, 16),
    });

  const openCreate = () => {
    setEditing(null);
    setErrors({});
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (m: MovementWithProduct) => {
    setEditing(m);
    setErrors({});
    setForm({
      productId: m.product_id,
      type: m.type,
      quantity: m.quantity,
      note: m.reason ?? "",
      saleType: (m.sale_type ?? "minorista") as SaleType,
      logistics: m.logistics ?? "",
      movementDate: new Date(m.movement_date).toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    let res;
    if (editing) {
      res = await updateMovement(
        editing.id,
        { product_id: editing.product_id, type: editing.type, quantity: editing.quantity },
        {
          product_id: form.productId,
          type: form.type,
          quantity: form.quantity,
          reason: form.note || null,
          sale_type: form.saleType,
          logistics: form.logistics.trim() || null,
          movement_date: new Date(form.movementDate).toISOString(),
        }
      );
    } else {
      res = await createMovement({
        product_id: form.productId,
        type: form.type,
        quantity: form.quantity,
        reason: form.note || undefined,
        sale_type: form.saleType,
        logistics: form.logistics.trim() || null,
        movement_date: new Date(form.movementDate).toISOString(),
      });
    }
    setSaving(false);
    if (!res.error) {
      setDialogOpen(false);
      setEditing(null);
      resetForm();
      setErrors({});
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

  const formatDateOnly = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const handleDownloadDocument = (docType: "factura" | "remito") => {
    toast.info(`La descarga de ${docType} estará disponible próximamente`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Movimientos de Stock</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {movements.length} registros
          </p>
        </div>
        <Button
          className="gap-2 gradient-primary shadow-primary text-primary-foreground"
          onClick={openCreate}
          disabled={products.length === 0}
        >
          <Plus className="h-4 w-4" />
          Registrar movimiento
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Entradas hoy", value: stats.entradasHoy, icon: ArrowDownCircle, color: "text-success" },
          { label: "Salidas hoy", value: stats.salidasHoy, icon: ArrowUpCircle, color: "text-destructive" },
          { label: "Entradas (7d)", value: stats.entradas7, icon: ArrowDownCircle, color: "text-success" },
          { label: "Salidas (7d)", value: stats.salidas7, icon: ArrowUpCircle, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Buscar movimientos por producto o SKU" placeholder="Buscar por producto o SKU..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Vista tabla (desktop) */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venta</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor ($)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logística</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha mov.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando movimientos...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                  {movements.length === 0 ? "Aún no hay movimientos. Registrá el primero con el botón de arriba." : "No hay movimientos con esos filtros"}
                </td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{m.product_name}</td>
                    <td className="px-4 py-3">
                      {m.product_sku ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{m.product_sku}</code> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={m.type === "entrada"
                        ? "bg-success-light text-success border-success/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                      }>
                        {m.type === "entrada" ? (
                          <><ArrowDownCircle className="mr-1 h-3 w-3" />Entrada</>
                        ) : (
                          <><ArrowUpCircle className="mr-1 h-3 w-3" />Salida</>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {m.sale_type ? (
                        <Badge variant="outline" className="capitalize text-xs">
                          {m.sale_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">{m.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      {m.value > 0 ? formatCurrency(m.value) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.logistics ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateOnly(m.movement_date)}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Editar movimiento"
                          onClick={() => openEdit(m)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Descargar documento">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadDocument("factura")}>
                              Factura
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadDocument("remito")}>
                              Remito
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista tarjetas (móvil) */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando movimientos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {movements.length === 0 ? "Aún no hay movimientos. Tocá el botón + para registrar el primero." : "No hay movimientos con esos filtros"}
          </div>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{m.product_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge className={m.type === "entrada"
                      ? "bg-success-light text-success border-success/20 text-[10px] py-0"
                      : "bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0"
                    }>
                      {m.type === "entrada" ? <><ArrowDownCircle className="mr-1 h-3 w-3" />Entrada</> : <><ArrowUpCircle className="mr-1 h-3 w-3" />Salida</>}
                    </Badge>
                    {m.sale_type && (
                      <Badge variant="outline" className="capitalize text-[10px] py-0">{m.sale_type}</Badge>
                    )}
                    {m.product_sku && <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{m.product_sku}</code>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold leading-none text-foreground">{m.quantity}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">unid.</p>
                  {m.value > 0 && (
                    <p className="mt-1 text-xs font-semibold text-foreground">{formatCurrency(m.value)}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                <span>{formatDateOnly(m.movement_date)}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => openEdit(m)}>
                    <Edit2 className="h-3 w-3" />Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Download className="h-3 w-3" />Doc.
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadDocument("factura")}>Factura</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDocument("remito")}>Remito</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {m.logistics && <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Logística:</span> {m.logistics}</p>}
              {m.reason && <p className="mt-1 text-xs text-muted-foreground">{m.reason}</p>}
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar movimiento" : "Registrar movimiento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground">(stock: {p.current_stock})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-xs text-destructive">{errors.productId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de movimiento *</Label>
              <div className="flex gap-3">
                {(["entrada", "salida"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium capitalize transition-colors ${
                      form.type === t
                        ? t === "entrada"
                          ? "border-success bg-success-light text-success"
                          : "border-destructive bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t === "entrada" ? "📥 Entrada" : "📤 Salida"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de venta *</Label>
                <Select value={form.saleType} onValueChange={(v) => setForm({ ...form, saleType: v as SaleType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minorista">Minorista</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha del movimiento *</Label>
              <Input
                type="datetime-local"
                value={form.movementDate}
                onChange={(e) => setForm({ ...form, movementDate: e.target.value })}
              />
              {errors.movementDate && <p className="text-xs text-destructive">{errors.movementDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Logística <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                placeholder="Ej: Andreani, OCA, Cadete propio..."
                value={form.logistics}
                onChange={(e) => setForm({ ...form, logistics: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nota <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                placeholder="Ej: Compra a proveedor, Pedido #1024..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary shadow-primary text-primary-foreground">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
