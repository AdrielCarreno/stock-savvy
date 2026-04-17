import { useState } from "react";
import { Plus, Search, Filter, Edit2, Trash2, AlertTriangle, Warehouse } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
}

const CATEGORIES = ["Aceites", "Harinas", "Granos", "Azúcares", "Lácteos", "Bebidas", "Limpieza", "Otros"];
const WAREHOUSES = ["Principal", "Sucursal Norte", "Sucursal Sur", "Depósito Central"];

const initialProducts: Product[] = [
  { id: 1, name: "Aceite de girasol 1L", sku: "ACE-001", category: "Aceites", warehouse: "Principal", costPrice: 1200, salePrice: 1650, stock: 3, minStock: 20 },
  { id: 2, name: "Harina 000 x 1kg", sku: "HAR-002", category: "Harinas", warehouse: "Depósito Central", costPrice: 450, salePrice: 650, stock: 5, minStock: 15 },
  { id: 3, name: "Arroz largo fino 1kg", sku: "ARR-003", category: "Granos", warehouse: "Depósito Central", costPrice: 380, salePrice: 550, stock: 8, minStock: 25 },
  { id: 4, name: "Azúcar blanca 1kg", sku: "AZU-001", category: "Azúcares", warehouse: "Sucursal Norte", costPrice: 420, salePrice: 600, stock: 2, minStock: 20 },
  { id: 5, name: "Leche entera 1L", sku: "LAC-001", category: "Lácteos", warehouse: "Sucursal Sur", costPrice: 320, salePrice: 480, stock: 45, minStock: 10 },
  { id: 6, name: "Coca-Cola 1.5L", sku: "BEB-001", category: "Bebidas", warehouse: "Principal", costPrice: 780, salePrice: 1100, stock: 32, minStock: 12 },
  { id: 7, name: "Detergente 500ml", sku: "LIM-001", category: "Limpieza", warehouse: "Sucursal Norte", costPrice: 560, salePrice: 820, stock: 28, minStock: 8 },
  { id: 8, name: "Aceite de oliva 500ml", sku: "ACE-002", category: "Aceites", warehouse: "Principal", costPrice: 2200, salePrice: 3100, stock: 15, minStock: 6 },
];

const emptyForm: Omit<Product, "id"> = {
  name: "", sku: "", category: "", warehouse: "Principal", costPrice: 0, salePrice: 0, stock: 0, minStock: 0,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchWarehouse = filterWarehouse === "all" || p.warehouse === filterWarehouse;
    return matchSearch && matchCategory && matchWarehouse;
  });

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const { id, ...rest } = p;
    setForm(rest);
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    if (!form.sku.trim()) errs.sku = "El SKU es requerido";
    if (!form.category) errs.category = "La categoría es requerida";
    if (form.costPrice < 0) errs.costPrice = "No puede ser negativo";
    if (form.salePrice < 0) errs.salePrice = "No puede ser negativo";
    if (form.stock < 0) errs.stock = "No puede ser negativo";
    if (form.minStock < 0) errs.minStock = "No puede ser negativo";
    // SKU uniqueness
    const skuExists = products.some(
      (p) => p.sku === form.sku && p.id !== editingProduct?.id
    );
    if (skuExists) errs.sku = "El SKU ya existe";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...form, id: editingProduct.id } : p));
    } else {
      setProducts((prev) => [...prev, { ...form, id: Date.now() }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Productos</h2>
          <p className="text-sm text-muted-foreground">{products.length} productos registrados</p>
        </div>
        <Button className="gap-2 gradient-primary shadow-primary text-primary-foreground" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
          <SelectTrigger className="w-full sm:w-48">
            <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Depósito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los depósitos</SelectItem>
            {WAREHOUSES.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depósito</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P. Costo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P. Venta</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mín.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No se encontraron productos</td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                          <span className="font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{p.sku}</code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Warehouse className="h-3 w-3" />
                          {p.warehouse}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.costPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.salePrice)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${isLow ? "text-warning" : "text-foreground"}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p.minStock}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del producto"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="ACE-001"
                className="font-mono"
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Precio costo *</Label>
              <Input
                type="number"
                min={0}
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
              />
              {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Precio venta *</Label>
              <Input
                type="number"
                min={0}
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
              />
              {errors.salePrice && <p className="text-xs text-destructive">{errors.salePrice}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stock actual *</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Math.max(0, Number(e.target.value)) })}
              />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stock mínimo *</Label>
              <Input
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Math.max(0, Number(e.target.value)) })}
              />
              {errors.minStock && <p className="text-xs text-destructive">{errors.minStock}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gradient-primary shadow-primary text-primary-foreground">
              {editingProduct ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
