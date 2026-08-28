import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Star, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/errors";
import { formatARS } from "@/lib/exporters";
import { toast } from "sonner";
import type { Product } from "@/types/database";

type Variant = {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
};

type SupplierLink = {
  supplier_id: string;
  product_id: string;
  cost: number | null;
  supplier_sku: string | null;
  is_preferred: boolean;
  suppliers?: { name: string } | null;
};

type PriceHistory = {
  id: string;
  supplier_id: string;
  cost: number;
  effective_date: string;
  suppliers?: { name: string } | null;
};

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onChanged,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  const [vForm, setVForm] = useState({ name: "", size: "", color: "", sku: "", barcode: "", stock: "0" });
  const [sForm, setSForm] = useState({ supplier_id: "", cost: "", supplier_sku: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!product || !companyId) return;
    setLoading(true);
    const [v, l, h, s] = await Promise.all([
      supabase.from("product_variants").select("id, name, size, color, sku, barcode, stock").eq("product_id", product.id).order("created_at"),
      supabase.from("supplier_products").select("supplier_id, product_id, cost, supplier_sku, is_preferred, suppliers(name)").eq("product_id", product.id),
      supabase.from("supplier_price_history").select("id, supplier_id, cost, effective_date, suppliers(name)").eq("product_id", product.id).order("effective_date", { ascending: false }).limit(20),
      supabase.from("suppliers").select("id, name").eq("company_id", companyId).order("name"),
    ]);
    setVariants((v.data ?? []) as Variant[]);
    setLinks((l.data ?? []) as unknown as SupplierLink[]);
    setHistory((h.data ?? []) as unknown as PriceHistory[]);
    setSuppliers((s.data ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, [product, companyId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  /* -------- Variantes -------- */
  const addVariant = async () => {
    if (!product || !companyId || !vForm.name.trim()) {
      toast.error("Indicá un nombre para la variante");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("product_variants").insert({
      company_id: companyId,
      product_id: product.id,
      name: vForm.name.trim(),
      size: vForm.size.trim() || null,
      color: vForm.color.trim() || null,
      sku: vForm.sku.trim() || null,
      barcode: vForm.barcode.trim() || null,
      stock: Number(vForm.stock) || 0,
    });
    setSaving(false);
    if (error) return toast.error(friendlyError(error, "Error al crear la variante"));
    toast.success("Variante agregada");
    setVForm({ name: "", size: "", color: "", sku: "", barcode: "", stock: "0" });
    load();
    onChanged?.();
  };

  const removeVariant = async (id: string) => {
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) return toast.error(friendlyError(error, "Error al eliminar la variante"));
    toast.success("Variante eliminada");
    load();
  };

  /* -------- Proveedores -------- */
  const addSupplier = async () => {
    if (!product || !companyId || !sForm.supplier_id) {
      toast.error("Elegí un proveedor");
      return;
    }
    setSaving(true);
    const cost = sForm.cost === "" ? null : Number(sForm.cost);
    const { error } = await supabase.from("supplier_products").upsert(
      {
        company_id: companyId,
        supplier_id: sForm.supplier_id,
        product_id: product.id,
        cost,
        supplier_sku: sForm.supplier_sku.trim() || null,
      },
      { onConflict: "supplier_id,product_id" }
    );
    if (!error && cost !== null) {
      await supabase.from("supplier_price_history").insert({
        company_id: companyId,
        supplier_id: sForm.supplier_id,
        product_id: product.id,
        cost,
      });
    }
    setSaving(false);
    if (error) return toast.error(friendlyError(error, "Error al asociar el proveedor"));
    toast.success("Proveedor asociado");
    setSForm({ supplier_id: "", cost: "", supplier_sku: "" });
    load();
    onChanged?.();
  };

  const setPreferred = async (supplierId: string) => {
    if (!product) return;
    await supabase.from("supplier_products").update({ is_preferred: false }).eq("product_id", product.id);
    const { error } = await supabase
      .from("supplier_products")
      .update({ is_preferred: true })
      .eq("product_id", product.id)
      .eq("supplier_id", supplierId);
    if (error) return toast.error(friendlyError(error, "Error al marcar el proveedor"));
    load();
  };

  const removeSupplier = async (supplierId: string) => {
    if (!product) return;
    const { error } = await supabase
      .from("supplier_products")
      .delete()
      .eq("product_id", product.id)
      .eq("supplier_id", supplierId);
    if (error) return toast.error(friendlyError(error, "Error al quitar el proveedor"));
    load();
    onChanged?.();
  };

  if (!product) return null;

  const cost = Number(product.cost ?? 0);
  const retail = Number(product.price_retail ?? product.price ?? 0);
  const wholesale = Number(product.price_wholesale ?? 0);
  const marginPct = (sale: number) => (cost > 0 && sale > 0 ? ((sale - cost) / cost) * 100 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{product.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="margins" className="w-full">
          <TabsList className="mb-3 flex w-full gap-1 overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="margins" className="px-3 text-xs">Márgenes</TabsTrigger>
            <TabsTrigger value="variants" className="px-3 text-xs">Variantes ({variants.length})</TabsTrigger>
            <TabsTrigger value="suppliers" className="px-3 text-xs">Proveedores ({links.length})</TabsTrigger>
          </TabsList>

          {/* Márgenes */}
          <TabsContent value="margins" className="mt-0 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Costo</p>
                <p className="text-base font-bold">{formatARS(cost)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Mayorista</p>
                <p className="text-base font-bold">{formatARS(wholesale)}</p>
                <p className="text-xs text-success">{marginPct(wholesale).toFixed(0)}% margen</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Minorista</p>
                <p className="text-base font-bold">{formatARS(retail)}</p>
                <p className="text-xs text-success">{marginPct(retail).toFixed(0)}% margen</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              Ganancia estimada por unidad: <b className="text-foreground">{formatARS(retail - cost)}</b> minorista ·{" "}
              <b className="text-foreground">{formatARS(wholesale - cost)}</b> mayorista.
            </div>
          </TabsContent>

          {/* Variantes */}
          <TabsContent value="variants" className="mt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 space-y-1 sm:col-span-1">
                <Label className="text-xs">Nombre *</Label>
                <Input value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} placeholder="Remera" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Talle</Label>
                <Input value={vForm.size} onChange={(e) => setVForm({ ...vForm, size: e.target.value })} placeholder="M" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input value={vForm.color} onChange={(e) => setVForm({ ...vForm, color: e.target.value })} placeholder="Negro" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input value={vForm.sku} onChange={(e) => setVForm({ ...vForm, sku: e.target.value.toUpperCase() })} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Código de barras</Label>
                <Input value={vForm.barcode} onChange={(e) => setVForm({ ...vForm, barcode: e.target.value })} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input type="number" min={0} value={vForm.stock} onChange={(e) => setVForm({ ...vForm, stock: e.target.value })} />
              </div>
            </div>
            <Button onClick={addVariant} disabled={saving} size="sm" className="w-full gap-1.5 gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Agregar variante
            </Button>

            {loading ? (
              <div className="py-6 text-center"><Loader2 className="inline h-4 w-4 animate-spin" /></div>
            ) : variants.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Este producto no tiene variantes cargadas.</p>
            ) : (
              <div className="space-y-2">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{v.name}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {v.size && <Badge variant="secondary" className="text-[10px]">Talle {v.size}</Badge>}
                        {v.color && <Badge variant="secondary" className="text-[10px]">{v.color}</Badge>}
                        {v.sku && <code className="rounded bg-muted px-1 text-[10px]">{v.sku}</code>}
                      </div>
                    </div>
                    <span className="text-sm font-bold">{v.stock}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeVariant(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Proveedores */}
          <TabsContent value="suppliers" className="mt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Proveedor *</Label>
                <Select value={sForm.supplier_id} onValueChange={(v) => setSForm({ ...sForm, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegí un proveedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Costo</Label>
                <Input type="number" min={0} value={sForm.cost} onChange={(e) => setSForm({ ...sForm, cost: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Código del proveedor</Label>
                <Input value={sForm.supplier_sku} onChange={(e) => setSForm({ ...sForm, supplier_sku: e.target.value })} />
              </div>
            </div>
            <Button onClick={addSupplier} disabled={saving} size="sm" className="w-full gap-1.5 gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Asociar proveedor
            </Button>

            {links.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Sin proveedores asociados.</p>
            ) : (
              <div className="space-y-2">
                {links.map((l) => (
                  <div key={l.supplier_id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.suppliers?.name ?? "Proveedor"}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.cost != null ? formatARS(Number(l.cost)) : "Sin costo"} {l.supplier_sku ? `· ${l.supplier_sku}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${l.is_preferred ? "text-warning" : ""}`}
                      title="Marcar como preferido"
                      onClick={() => setPreferred(l.supplier_id)}
                    >
                      <Star className={`h-3.5 w-3.5 ${l.is_preferred ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeSupplier(l.supplier_id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <History className="h-3.5 w-3.5" /> Historial de precios
                </p>
                <div className="space-y-1">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">
                        {h.suppliers?.name ?? "—"} · {new Date(h.effective_date).toLocaleDateString("es-AR")}
                      </span>
                      <span className="font-semibold">{formatARS(Number(h.cost))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
