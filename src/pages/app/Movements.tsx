import { useState } from "react";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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

interface Movement {
  id: number;
  productName: string;
  sku: string;
  type: "entrada" | "salida";
  quantity: number;
  note?: string;
  date: string;
  user: string;
}

const PRODUCTS = [
  { id: 1, name: "Aceite de girasol 1L", sku: "ACE-001", stock: 3 },
  { id: 2, name: "Harina 000 x 1kg", sku: "HAR-002", stock: 5 },
  { id: 3, name: "Arroz largo fino 1kg", sku: "ARR-003", stock: 8 },
  { id: 4, name: "Azúcar blanca 1kg", sku: "AZU-001", stock: 2 },
  { id: 5, name: "Leche entera 1L", sku: "LAC-001", stock: 45 },
  { id: 6, name: "Coca-Cola 1.5L", sku: "BEB-001", stock: 32 },
];

const initialMovements: Movement[] = [
  { id: 1, productName: "Aceite de girasol 1L", sku: "ACE-001", type: "entrada", quantity: 50, note: "Compra a proveedor", date: "2025-02-17 10:30", user: "Admin" },
  { id: 2, productName: "Harina 000 x 1kg", sku: "HAR-002", type: "salida", quantity: 12, note: "Venta local", date: "2025-02-17 09:15", user: "Admin" },
  { id: 3, productName: "Arroz largo fino 1kg", sku: "ARR-003", type: "entrada", quantity: 100, date: "2025-02-16 14:00", user: "Admin" },
  { id: 4, productName: "Coca-Cola 1.5L", sku: "BEB-001", type: "salida", quantity: 24, note: "Pedido #1024", date: "2025-02-16 11:45", user: "Admin" },
  { id: 5, productName: "Leche entera 1L", sku: "LAC-001", type: "entrada", quantity: 60, date: "2025-02-15 16:20", user: "Admin" },
  { id: 6, productName: "Azúcar blanca 1kg", sku: "AZU-001", type: "salida", quantity: 8, note: "Venta", date: "2025-02-15 10:00", user: "Admin" },
  { id: 7, productName: "Aceite de girasol 1L", sku: "ACE-001", type: "salida", quantity: 30, date: "2025-02-14 09:30", user: "Admin" },
  { id: 8, productName: "Harina 000 x 1kg", sku: "HAR-002", type: "entrada", quantity: 80, note: "Reposición urgente", date: "2025-02-13 15:00", user: "Admin" },
];

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "entrada" as "entrada" | "salida", quantity: 1, note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = movements.filter(
    (m) =>
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.productId) errs.productId = "Seleccioná un producto";
    if (form.quantity < 1) errs.quantity = "La cantidad debe ser mayor a 0";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const product = PRODUCTS.find((p) => p.id === Number(form.productId));
    if (!product) return;
    const newMovement: Movement = {
      id: Date.now(),
      productName: product.name,
      sku: product.sku,
      type: form.type,
      quantity: form.quantity,
      note: form.note || undefined,
      date: new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }),
      user: "Admin",
    };
    setMovements([newMovement, ...movements]);
    setDialogOpen(false);
    setForm({ productId: "", type: "entrada", quantity: 1, note: "" });
    setErrors({});
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Movimientos de Stock</h2>
          <p className="text-sm text-muted-foreground">{movements.length} registros totales</p>
        </div>
        <Button className="gap-2 gradient-primary shadow-primary text-primary-foreground" onClick={() => { setErrors({}); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Registrar movimiento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Entradas hoy", value: "2", icon: ArrowDownCircle, color: "text-success" },
          { label: "Salidas hoy", value: "1", icon: ArrowUpCircle, color: "text-destructive" },
          { label: "Entradas (7d)", value: "14", icon: ArrowDownCircle, color: "text-success" },
          { label: "Salidas (7d)", value: "9", icon: ArrowUpCircle, color: "text-destructive" },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por producto o SKU..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No hay movimientos</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{m.productName}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{m.sku}</code>
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
                    <td className="px-4 py-3 text-center font-bold text-foreground">{m.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.note ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} <span className="text-muted-foreground">(stock: {p.stock})</span>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-primary shadow-primary text-primary-foreground">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
