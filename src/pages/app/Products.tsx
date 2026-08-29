import { useMemo, useState } from "react";
import { Plus, Search, Filter, Edit2, Trash2, AlertTriangle, Loader2, Upload, Warehouse, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ImportProductsDialog } from "@/components/products/ImportProductsDialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, type ProductInput } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProductStock } from "@/hooks/useProductStock";
import type { Product } from "@/types/database";

type ProductFormState = ProductInput & { warehouse_id?: string };

const emptyForm: ProductFormState = {
  name: "", sku: "", category: "", client: "", unit: "unidad",
  current_stock: 0, min_stock: 0, price: 0, price_wholesale: 0, price_retail: 0, cost: 0,
  warehouse_id: undefined,
};

export default function Products() {
  const { products, loading, createProduct, updateProduct, deleteProduct, bulkCreateProducts, bulkDeleteProducts, bulkUpdateProducts } = useProducts();
  const { warehouses, createWarehouse } = useWarehouses();
  const { stock: productStock, refresh: refreshStock } = useProductStock();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState<{ category: string; client: string; min_stock: string; price: string }>({
    category: "", client: "", min_stock: "", price: "",
  });
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  const existingSkus = useMemo(
    () => new Set(products.map((p) => p.sku).filter((s): s is string => !!s)),
    [products]
  );

  // Categorías reales derivadas de los productos del usuario
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  // Clientes reales derivados de los productos del usuario
  const clients = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.client && p.client.trim()) set.add(p.client.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  // Map: productId -> quantity in selected warehouse
  const stockByProductInWarehouse = useMemo(() => {
    const map = new Map<string, number>();
    if (filterWarehouse === "all") return map;
    productStock
      .filter((s) => s.warehouse_id === filterWarehouse)
      .forEach((s) => map.set(s.product_id, s.quantity));
    return map;
  }, [productStock, filterWarehouse]);

  // Set of productIds present in selected warehouse (qty > 0)
  const productsInWarehouse = useMemo(() => {
    if (filterWarehouse === "all") return null;
    const set = new Set<string>();
    productStock
      .filter((s) => s.warehouse_id === filterWarehouse && s.quantity > 0)
      .forEach((s) => set.add(s.product_id));
    return set;
  }, [productStock, filterWarehouse]);

  // Map: productId -> array of warehouse names (where qty > 0, or default if none)
  const warehouseNameById = useMemo(() => {
    const map = new Map<string, string>();
    warehouses.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [warehouses]);

  const warehousesByProduct = useMemo(() => {
    const map = new Map<string, string[]>();
    productStock.forEach((s) => {
      if (s.quantity <= 0) return;
      const name = warehouseNameById.get(s.warehouse_id);
      if (!name) return;
      const arr = map.get(s.product_id) ?? [];
      if (!arr.includes(name)) arr.push(name);
      map.set(s.product_id, arr);
    });
    return map;
  }, [productStock, warehouseNameById]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      ((p as any).barcode?.toLowerCase().includes(q) ?? false);
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchWarehouse = !productsInWarehouse || productsInWarehouse.has(p.id);
    return matchSearch && matchCategory && matchWarehouse;
  });

  const defaultWarehouseId = useMemo(
    () => warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id,
    [warehouses]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, warehouse_id: defaultWarehouseId });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: (p as any).barcode ?? "",
      category: p.category,
      client: p.client,
      unit: p.unit,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      max_stock: (p as any).max_stock ?? 0,
      expiry_date: (p as any).expiry_date ?? null,
      price: p.price,
      price_wholesale: (p as any).price_wholesale ?? 0,
      price_retail: (p as any).price_retail ?? p.price ?? 0,
      cost: p.cost,
      description: p.description,
      warehouse_id: undefined,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    if ((form.current_stock ?? 0) < 0) errs.current_stock = "No puede ser negativo";
    if ((form.min_stock ?? 0) < 0) errs.min_stock = "No puede ser negativo";
    if ((form.price ?? 0) < 0) errs.price = "No puede ser negativo";
    if ((form.cost ?? 0) < 0) errs.cost = "No puede ser negativo";
    if (!editing && warehouses.length > 0 && !form.warehouse_id) {
      errs.warehouse_id = "Seleccioná un depósito";
    }
    const skuTrim = form.sku?.trim() || null;
    if (skuTrim) {
      const exists = products.some((p) => p.sku === skuTrim && p.id !== editing?.id);
      if (exists) errs.sku = "El SKU ya existe";
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    const { warehouse_id, ...rest } = form;
    const payload: ProductInput = {
      ...rest,
      sku: form.sku?.trim() || null,
      category: form.category?.trim() || null,
      client: form.client?.trim() || null,
      // mantener price en sincronía con precio minorista para compatibilidad
      price: form.price_retail ?? form.price ?? 0,
    };
    const { error } = editing
      ? await updateProduct(editing.id, payload)
      : await createProduct(payload, warehouse_id);
    setSaving(false);
    if (!error) {
      setDialogOpen(false);
      await refreshStock();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteProduct(deleteId);
    setDeleteId(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    await bulkDeleteProducts(Array.from(selectedIds));
    setBulkDeleteOpen(false);
    clearSelection();
    await refreshStock();
  };

  const handleBulkEdit = async () => {
    const patch: Partial<ProductInput> = {};
    if (bulkForm.category.trim()) patch.category = bulkForm.category.trim();
    if (bulkForm.client.trim()) patch.client = bulkForm.client.trim();
    if (bulkForm.min_stock !== "") patch.min_stock = Math.max(0, Number(bulkForm.min_stock));
    if (bulkForm.price !== "") patch.price = Math.max(0, Number(bulkForm.price));
    if (Object.keys(patch).length === 0) {
      setBulkEditOpen(false);
      return;
    }
    await bulkUpdateProducts(Array.from(selectedIds), patch);
    setBulkEditOpen(false);
    setBulkForm({ category: "", client: "", min_stock: "", price: "" });
    clearSelection();
  };

  const formatCurrency = (n: number | null) =>
    n == null ? "—" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Productos</h2>
          <p className="text-sm text-muted-foreground">{products.length} productos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button className="gap-2 gradient-primary shadow-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar productos por nombre o SKU"
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
            {categories.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No hay categorías cargadas
              </div>
            ) : (
              categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
            )}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
            <SelectTrigger className="w-full sm:w-48">
              <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Depósito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los depósitos</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}{w.is_default ? " (Principal)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2 whitespace-nowrap"
            onClick={() => { setNewWarehouseName(""); setWarehouseDialogOpen(true); }}
            title="Crear nuevo depósito"
            aria-label="Crear nuevo depósito"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo depósito</span>
          </Button>

        </div>
      </div>

      {/* Barra de acciones masivas */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-light/40 px-4 py-2 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <span className="font-semibold">{selectedIds.size}</span> seleccionado(s)
            <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkEditOpen(true)}>
              <Edit2 className="h-3.5 w-3.5" />Editar seleccionados
            </Button>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />Eliminar seleccionados
            </Button>
          </div>
        </div>
      )}

      {/* Vista tabla (desktop) */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-3 w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Depósito</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P. Costo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P. Mayorista</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">P. Minorista</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {filterWarehouse === "all" ? "Stock" : "Stock depósito"}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mín.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando productos...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">
                    {products.length === 0 ? "Aún no tenés productos. Creá el primero con el botón de arriba." : "No se encontraron productos"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.current_stock <= p.min_stock;
                  const whNames = warehousesByProduct.get(p.id) ?? [];
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          aria-label={`Seleccionar ${p.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                          <span className="font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.sku ? <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{p.sku}</code> : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.category ? <Badge variant="secondary" className="text-xs">{p.category}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {whNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {whNames.map((n) => (
                              <Badge key={n} variant="outline" className="text-[10px] gap-1">
                                <Warehouse className="h-3 w-3" />{n}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.cost)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency((p as any).price_wholesale)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency((p as any).price_retail ?? p.price)}</td>
                      <td className="px-4 py-3 text-center">
                        {filterWarehouse === "all" ? (
                          <span className={`font-bold ${isLow ? "text-warning" : "text-foreground"}`}>{p.current_stock}</span>
                        ) : (
                          <span className="font-bold text-foreground">
                            {stockByProductInWarehouse.get(p.id) ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{p.min_stock}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailProduct(p)} title="Detalle, variantes y proveedores" aria-label="Ver detalle">
                            <Layers className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteId(p.id)}>
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

      {/* Vista tarjetas (móvil) */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />Cargando productos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {products.length === 0 ? "Aún no tenés productos. Tocá el botón + para crear el primero." : "No se encontraron productos"}
          </div>
        ) : (
          filtered.map((p) => {
            const isLow = p.current_stock <= p.min_stock;
            const stockShown = filterWarehouse === "all" ? p.current_stock : (stockByProductInWarehouse.get(p.id) ?? 0);
            const whNames = warehousesByProduct.get(p.id) ?? [];
            const selected = selectedIds.has(p.id);
            return (
              <div key={p.id} className={`rounded-xl border p-3 shadow-card ${selected ? "border-primary bg-primary-light/30" : "border-border bg-card"}`}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggleSelect(p.id)}
                    className="mt-1"
                    aria-label={`Seleccionar ${p.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                      <p className="truncate font-semibold text-foreground">{p.name}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.sku && <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{p.sku}</code>}
                      {p.category && <Badge variant="secondary" className="text-[10px] py-0">{p.category}</Badge>}
                      {whNames.map((n) => (
                        <Badge key={n} variant="outline" className="text-[10px] py-0 gap-1">
                          <Warehouse className="h-3 w-3" />{n}
                        </Badge>
                      ))}
                    </div>
                    {p.client && <p className="mt-1 text-xs text-muted-foreground truncate">Cliente: {p.client}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold leading-none ${isLow ? "text-warning" : "text-foreground"}`}>{stockShown}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">mín. {p.min_stock}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Minorista: </span>
                    <span className="font-semibold text-foreground">{formatCurrency((p as any).price_retail ?? p.price)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailProduct(p)} aria-label="Ver detalle">
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
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
              <Label>SKU</Label>
              <Input
                value={form.sku ?? ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="ACE-001"
                className="font-mono"
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Código de barras</Label>
              <Input
                value={form.barcode ?? ""}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="7790000000000"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej: Bebidas, Limpieza..."
                list="product-categories-list"
              />
              <datalist id="product-categories-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Cliente</Label>
              <Input
                value={form.client ?? ""}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Ej: Supermercado Norte"
                list="product-clients-list"
              />
              <datalist id="product-clients-list">
                {clients.map((c) => <option key={c} value={c} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">A quién le pertenece esta mercadería (opcional).</p>
            </div>
            <div className="space-y-1.5">
              <Label>Precio costo</Label>
              <Input
                type="number"
                min={0}
                value={form.cost ?? 0}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Precio mayorista</Label>
              <Input
                type="number"
                min={0}
                value={form.price_wholesale ?? 0}
                onChange={(e) => setForm({ ...form, price_wholesale: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio minorista</Label>
              <Input
                type="number"
                min={0}
                value={form.price_retail ?? 0}
                onChange={(e) => setForm({ ...form, price_retail: Number(e.target.value) })}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stock actual *</Label>
              <Input
                type="number"
                min={0}
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: Math.max(0, Number(e.target.value)) })}
              />
              {errors.current_stock && <p className="text-xs text-destructive">{errors.current_stock}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stock mínimo *</Label>
              <Input
                type="number"
                min={0}
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: Math.max(0, Number(e.target.value)) })}
              />
              {errors.min_stock && <p className="text-xs text-destructive">{errors.min_stock}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stock máximo</Label>
              <Input
                type="number"
                min={0}
                value={form.max_stock ?? 0}
                onChange={(e) => setForm({ ...form, max_stock: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimiento</Label>
              <Input
                type="date"
                value={form.expiry_date ?? ""}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value || null })}
              />
            </div>
            {!editing && warehouses.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label>Depósito *</Label>
                <Select
                  value={form.warehouse_id ?? ""}
                  onValueChange={(v) => setForm({ ...form, warehouse_id: v })}
                >
                  <SelectTrigger>
                    <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Seleccionar depósito..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}{w.is_default ? " (Principal)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouse_id && <p className="text-xs text-destructive">{errors.warehouse_id}</p>}
                <p className="text-xs text-muted-foreground">
                  El stock inicial se asignará a este depósito.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-primary shadow-primary text-primary-foreground">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el producto y sus movimientos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImportProductsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingSkus={existingSkus}
        onImport={bulkCreateProducts}
      />

      <ProductDetailDialog
        product={detailProduct}
        open={!!detailProduct}
        onOpenChange={(o) => !o && setDetailProduct(null)}
        onChanged={() => { refreshStock(); }}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedIds.size} producto(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los productos seleccionados y sus movimientos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {selectedIds.size} producto(s)</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Sólo se actualizarán los campos que completes. Los vacíos no se tocan.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input
                value={bulkForm.category}
                onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })}
                placeholder="Ej: Bebidas"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input
                value={bulkForm.client}
                onChange={(e) => setBulkForm({ ...bulkForm, client: e.target.value })}
                placeholder="Ej: Supermercado Norte"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  min={0}
                  value={bulkForm.min_stock}
                  onChange={(e) => setBulkForm({ ...bulkForm, min_stock: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio venta</Label>
                <Input
                  type="number"
                  min={0}
                  value={bulkForm.price}
                  onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkEdit} className="gradient-primary shadow-primary text-primary-foreground">
              Aplicar a {selectedIds.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo depósito</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre del depósito *</Label>
              <Input
                autoFocus
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
                placeholder="Ej: Sucursal Centro, Depósito Norte..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Podrás asignar productos y stock a este depósito una vez creado.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)} disabled={savingWarehouse}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary shadow-primary text-primary-foreground"
              disabled={savingWarehouse || !newWarehouseName.trim()}
              onClick={async () => {
                setSavingWarehouse(true);
                const { error } = await createWarehouse(newWarehouseName);
                setSavingWarehouse(false);
                if (!error) {
                  setWarehouseDialogOpen(false);
                  setNewWarehouseName("");
                }
              }}
            >
              {savingWarehouse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear depósito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
