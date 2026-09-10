import { useEffect, useMemo, useRef, useState } from "react";
import { Barcode, Minus, Plus, Search, ShoppingCart, Trash2, X, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { usePos, PAYMENT_METHODS, fmtARS, type CartLine, type PaymentSplit } from "@/hooks/usePos";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { printTicket } from "@/lib/ticket";
import { toast } from "sonner";
import type { Product } from "@/types/database";

const priceOf = (p: Product) => Number(p.price_retail ?? p.price ?? 0);

export function PosRegister({ onSold }: { onSold?: () => void }) {
  const { products, loading, refresh } = useProducts();
  const { company, profile } = useAuth();
  const { createSale } = usePos();
  const scanRef = useRef<HTMLInputElement>(null);

  const [scan, setScan] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [customerId, setCustomerId] = useState("final");
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<PaymentSplit[]>([{ method: "efectivo", amount: 0 }]);
  const [received, setReceived] = useState(0);

  useEffect(() => {
    supabase.from("customers").select("id, name").order("name").then(({ data }) => setCustomers(data ?? []));
  }, []);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.unit_price * l.quantity, 0), [cart]);
  const discountTotal = Math.min(subtotal, Number(discount || 0) + (subtotal * Number(discountPct || 0)) / 100);
  const taxable = Math.max(0, subtotal - discountTotal);
  const taxTotal = (taxable * Number(taxPct || 0)) / 100;
  const total = Math.max(0, taxable + taxTotal);
  const paid = payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const change = Math.max(0, received - total);

  const addToCart = (p: Product, qty = 1) => {
    if (p.current_stock <= 0) {
      toast.error(`${p.name} sin stock disponible`);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product_id === p.id);
      if (idx >= 0) {
        const line = prev[idx];
        if (line.quantity + qty > p.current_stock) {
          toast.error(`Solo hay ${p.current_stock} unidades de ${p.name}`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...line, quantity: line.quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          unit_price: priceOf(p),
          quantity: qty,
          stock: p.current_stock,
          discount: 0,
        },
      ];
    });
  };

  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.product_id !== id) return l;
        if (qty > l.stock) {
          toast.error(`Solo hay ${l.stock} unidades disponibles`);
          return { ...l, quantity: l.stock };
        }
        return { ...l, quantity: Math.max(1, qty) };
      })
    );
  };

  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product_id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountPct(0);
    setReceived(0);
    setPayments([{ method: "efectivo", amount: 0 }]);
    scanRef.current?.focus();
  };

  const query = scan.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return products.slice(0, 24);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      )
      .slice(0, 24);
  }, [products, query]);

  const handleScanEnter = () => {
    if (!query) return;
    const exact = products.find((p) => p.barcode?.toLowerCase() === query || p.sku?.toLowerCase() === query);
    const target = exact ?? results[0];
    if (!target) return toast.error("Producto no encontrado");
    addToCart(target);
    setScan("");
  };

  // Atajos de teclado: F2 cobrar, Esc cancelar venta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) openCheckout();
      }
      if (e.key === "Escape" && !checkout && cart.length > 0) clearCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, checkout, total]);

  const openCheckout = () => {
    setPayments([{ method: "efectivo", amount: Number(total.toFixed(2)) }]);
    setReceived(Number(total.toFixed(2)));
    setCheckout(true);
  };

  const confirmSale = async () => {
    if (Math.abs(paid - total) > 0.5) {
      toast.error("El total pagado no coincide con el total de la venta");
      return;
    }
    setSaving(true);
    const cust = customerId === "final" ? null : customerId;
    const isCash = payments.some((p) => p.method === "efectivo");
    const res = await createSale({
      lines: cart,
      discount: discountTotal,
      tax: taxTotal,
      total,
      payments: payments.filter((p) => Number(p.amount) > 0),
      amount_received: isCash ? received : null,
      change_amount: isCash ? change : null,
      customer_id: cust,
      reference: `POS-${Date.now().toString().slice(-6)}`,
    });
    setSaving(false);
    if (res.error) return;

    printTicket({
      company: company?.name ?? "OneStock",
      seller: profile?.email ?? "Vendedor",
      customer: customers.find((c) => c.id === cust)?.name ?? null,
      date: new Date(),
      reference: (res.sale as { reference?: string } | null)?.reference ?? null,
      lines: cart.map((l) => ({ name: l.name, quantity: l.quantity, unit_price: l.unit_price })),
      subtotal,
      discount: discountTotal,
      tax: taxTotal,
      total,
      payments: payments.filter((p) => Number(p.amount) > 0),
      received: isCash ? received : null,
      change: isCash ? change : null,
    });

    setCheckout(false);
    clearCart();
    refresh();
    onSold?.();
  };

  const stockBadge = (p: Product) => {
    if (p.current_stock <= 0) return <Badge variant="destructive" className="text-[10px]">Sin stock</Badge>;
    if (p.current_stock <= (p.min_stock || 0)) return <Badge className="bg-warning text-warning-foreground text-[10px]">Bajo: {p.current_stock}</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Stock: {p.current_stock}</Badge>;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Buscador + catálogo */}
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Barcode className="h-3.5 w-3.5" /> Escaneá el código de barras o buscá por nombre / SKU
          </Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScanEnter()}
              placeholder="Escanear o buscar producto…"
              className="h-12 pl-9 text-base"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Enter agrega el producto · F2 cobra · Esc vacía el carrito</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No se encontraron productos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.current_stock <= 0}
                  className="flex min-h-[92px] flex-col justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-muted disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-primary">{fmtARS(priceOf(p))}</span>
                    {stockBadge(p)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="flex flex-col rounded-xl border border-border bg-card shadow-card lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="flex items-center gap-2 font-semibold"><ShoppingCart className="h-4 w-4 text-primary" /> Carrito ({cart.length})</h3>
          {cart.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearCart} className="gap-1 text-destructive">
              <X className="h-4 w-4" /> Cancelar
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Escaneá o tocá un producto para comenzar.</p>
          ) : (
            cart.map((l) => (
              <div key={l.product_id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtARS(l.unit_price)} c/u · stock {l.stock}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeLine(l.product_id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(l.product_id, l.quantity - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      value={l.quantity}
                      onChange={(e) => setQty(l.product_id, Number(e.target.value))}
                      className="h-8 w-14 text-center"
                    />
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(l.product_id, l.quantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold">{fmtARS(l.unit_price * l.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 border-t border-border p-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Desc. $</Label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Desc. %</Label>
              <Input type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} className="h-9" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Imp. %</Label>
              <Input type="number" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value))} className="h-9" />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="final">Consumidor final</SelectItem>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-0.5 pt-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmtARS(subtotal)}</span></div>
            {discountTotal > 0 && <div className="flex justify-between text-muted-foreground"><span>Descuento</span><span>-{fmtARS(discountTotal)}</span></div>}
            {taxTotal > 0 && <div className="flex justify-between text-muted-foreground"><span>Impuestos</span><span>{fmtARS(taxTotal)}</span></div>}
            <div className="flex items-center justify-between border-t border-border pt-1.5 text-xl font-bold">
              <span>Total</span><span className="text-primary">{fmtARS(total)}</span>
            </div>
          </div>

          <Button className="h-14 w-full gap-2 text-base" disabled={cart.length === 0} onClick={openCheckout}>
            <CreditCard className="h-5 w-5" /> Cobrar (F2)
          </Button>
        </div>
      </div>

      {/* Cobro */}
      <Dialog open={checkout} onOpenChange={setCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cobrar {fmtARS(total)}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {payments.map((p, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Medio de pago</Label>
                  <Select
                    value={p.method}
                    onValueChange={(v) => setPayments(payments.map((x, j) => (j === i ? { ...x, method: v } : x)))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label className="text-xs">Monto</Label>
                  <Input
                    type="number"
                    value={p.amount}
                    onChange={(e) => setPayments(payments.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))}
                  />
                </div>
                {payments.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => setPayments(payments.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setPayments([...payments, { method: "debito", amount: Math.max(0, total - paid) }])}
            >
              <Plus className="h-3.5 w-3.5" /> Agregar medio de pago
            </Button>

            {payments.some((p) => p.method === "efectivo") && (
              <div className="rounded-lg bg-muted p-3">
                <Label className="text-xs">Monto recibido en efectivo</Label>
                <Input type="number" value={received} onChange={(e) => setReceived(Number(e.target.value))} className="mt-1" />
                <p className="mt-2 text-sm">Vuelto: <span className="font-bold text-primary">{fmtARS(change)}</span></p>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagado</span>
              <span className={Math.abs(paid - total) > 0.5 ? "font-semibold text-destructive" : "font-semibold text-success"}>
                {fmtARS(paid)} / {fmtARS(total)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckout(false)}>Volver</Button>
            <Button onClick={confirmSale} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar e imprimir ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
