import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine, Upload, Camera, RefreshCw, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeCamera } from "@/components/operations/BarcodeCamera";
import { useScanWorkspace } from "@/hooks/useScanWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/errors";
import type { ScanDocument } from "@/lib/scanLocal";

const states = { pending: "Lectura pendiente", review: "Por revisar", confirmed: "Subida pendiente", uploaded: "Guardado en el negocio" };

function DocumentReview({ draft, disabled, confirm, remove, read }: { draft: ScanDocument; disabled: boolean; confirm: (id: string, text: string, type: ScanDocument["docType"]) => Promise<void>; remove: (id: string) => Promise<void>; read: (id: string) => Promise<void> }) {
  const [text, setText] = useState(draft.text);
  const [type, setType] = useState(draft.docType);
  const [preview, setPreview] = useState("");
  useEffect(() => { setText(draft.text); }, [draft.text]);
  useEffect(() => { const url = URL.createObjectURL(draft.file); setPreview(url); return () => URL.revokeObjectURL(url); }, [draft.file]);
  return <article className="space-y-3 border-b border-border py-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-medium">{draft.fileName}</p><p className="text-xs text-muted-foreground">{states[draft.status]}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" title="Descargar original" aria-label="Descargar original" asChild><a href={preview} download={draft.fileName}><Download className="h-4 w-4" /></a></Button>{draft.status !== "uploaded" && <Button variant="ghost" size="icon" title="Descartar documento local" aria-label="Descartar documento local" disabled={disabled} onClick={() => void remove(draft.id).catch(e => toast.error(friendlyError(e)))}><Trash2 className="h-4 w-4" /></Button>}</div></div>
    {draft.mime.startsWith("image/") ? <img src={preview} alt={draft.fileName} className="max-h-64 w-full object-contain" /> : <a href={preview} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary"><FileText className="h-4 w-4" />Abrir PDF</a>}
    {draft.error && <p role="alert" className="text-sm text-destructive">{draft.error}</p>}
    {draft.status === "pending" && <Button variant="outline" disabled={disabled} onClick={() => void read(draft.id)}>Leer texto</Button>}
    {(draft.status === "pending" || draft.status === "review") && <>
      <Label htmlFor={`type-${draft.id}`}>Tipo de documento</Label><select id={`type-${draft.id}`} value={type} onChange={e => setType(e.target.value as ScanDocument["docType"])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Factura</option><option>Remito</option><option>Comprobante</option></select>
      <Label htmlFor={`text-${draft.id}`}>Texto y datos revisados</Label><Textarea id={`text-${draft.id}`} value={text} onChange={e => setText(e.target.value)} rows={8} />
      <Button disabled={disabled || !text.trim()} onClick={() => void confirm(draft.id, text, type).catch(e => toast.error(friendlyError(e)))}>Confirmar documento revisado</Button>
    </>}
    {(draft.status === "confirmed" || draft.status === "uploaded") && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{draft.text}</p>}
  </article>;
}

export default function Scan() {
  const workspace = useScanWorkspace();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [type, setType] = useState<"entrada" | "salida">("entrada");
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<ScanDocument["docType"]>("Factura");
  const movementOp = useRef<{ signature: string; id: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const matched = workspace.products.filter(p => p.barcode === code.trim() || p.sku === code.trim());
  const selected = workspace.products.find(p => p.id === selectedId);
  const [productSearch, setProductSearch] = useState("");
  const [lastMovement, setLastMovement] = useState("");

  const lookup = (value: string) => {
    setCode(value.trim()); setSearched(true); setLastMovement("");
    const hits = workspace.products.filter(p => p.barcode === value.trim() || p.sku === value.trim());
    setSelectedId(hits.length === 1 ? hits[0].id : "");
  };
  const record = async () => {
    if (!selected || !profile?.company_id || !user || saving) return;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) return toast.error("La cantidad debe ser un entero mayor a cero.");
    const signature = JSON.stringify([selected.id, type, qty]);
    if (movementOp.current?.signature !== signature) movementOp.current = { signature, id: crypto.randomUUID() };
    const op = movementOp.current;
    if (!op) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("apply_stock_movement", { p_op_id: op.id, p_product_id: selected.id, p_type: type, p_quantity: qty, p_reason: "Escaneo de producto" });
      if (error) throw error;
      movementOp.current = null;
      setLastMovement(`${type === "entrada" ? "Entrada" : "Salida"} confirmada: ${qty} × ${selected.name}`);
      toast.success("Movimiento registrado"); await workspace.sync();
    } catch (e) { toast.error(friendlyError(e)); }
    finally { setSaving(false); }
  };
  const associate = async () => {
    if (!selected || !code.trim() || !profile?.company_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("products").update({ barcode: code.trim() }).eq("id", selected.id).eq("company_id", profile.company_id);
      if (error) throw error;
      toast.success("Código asociado"); await workspace.sync(); setSearched(true);
    } catch (e) { toast.error(friendlyError(e)); } finally { setSaving(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try { await workspace.addDocument(file, docType); toast.success("Documento guardado en este dispositivo"); }
    catch (e) { toast.error(friendlyError(e)); }
  };
  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div><h2 className="font-display text-2xl">Escanear</h2><p className="mt-1 text-sm text-muted-foreground">{workspace.online ? workspace.busy ? `Procesando · ${Math.round(workspace.progress * 100)}%` : "En línea" : "Sin conexión"} · {workspace.products.length} productos en este dispositivo</p></div><Button variant="outline" disabled={!workspace.online || workspace.busy} onClick={() => void workspace.sync()}><RefreshCw className={`mr-2 h-4 w-4 ${workspace.busy ? "animate-spin" : ""}`} />Reintentar / actualizar</Button></div>
    {workspace.error && <p role="alert" className="text-sm text-destructive">{workspace.error}</p>}
    {!workspace.online && <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">Búsqueda con la última copia guardada. Los movimientos y la asociación de códigos requieren conexión. Los documentos quedan en este dispositivo.</p>}
    <Tabs defaultValue="products"><TabsList className="grid w-full grid-cols-2 sm:w-96"><TabsTrigger value="products"><ScanLine className="mr-2 h-4 w-4" />Productos</TabsTrigger><TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" />Documentos</TabsTrigger></TabsList>
      <TabsContent value="products" className="mt-6"><div className="grid gap-8 lg:grid-cols-2"><section className="min-w-0 space-y-5"><BarcodeCamera onCode={lookup} /><form onSubmit={e => { e.preventDefault(); lookup(code); }} className="space-y-2"><Label htmlFor="scan-code">Código de barras, QR o SKU</Label><div className="flex gap-2"><Input id="scan-code" value={code} onChange={e => { setCode(e.target.value); setSearched(false); }} /><Button type="submit">Buscar</Button></div></form>
        {searched && matched.length === 0 && <p className="text-sm text-muted-foreground">No se encontró ese código en el catálogo guardado.</p>}
        {matched.length > 1 && <><Label htmlFor="matches">Coincidencias del código</Label><select id="matches" className="h-10 w-full rounded-md border border-input bg-background px-3" value={selectedId} onChange={e => setSelectedId(e.target.value)}><option value="">Seleccionar producto</option>{matched.map(p => <option value={p.id} key={p.id}>{p.name} · {p.sku}</option>)}</select></>}
        {searched && matched.length === 0 && <div className="space-y-2"><Label htmlFor="associate-search">Buscar producto para asociar</Label><Input id="associate-search" value={productSearch} onChange={e => setProductSearch(e.target.value)} /><div className="max-h-60 overflow-auto divide-y divide-border">{workspace.products.filter(p => productSearch && `${p.name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 30).map(p => <Button className="h-auto min-h-10 w-full justify-start whitespace-normal text-left" variant={p.id === selectedId ? "secondary" : "ghost"} key={p.id} onClick={() => setSelectedId(p.id)}>{p.name} · {p.sku}</Button>)}</div>{selected && <Button disabled={!workspace.online || saving || workspace.busy} onClick={() => void associate()}>Asociar código a {selected.name}</Button>}</div>}
      </section><section className="min-w-0 space-y-5 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">{selected ? <><div><h3 className="break-words font-display text-2xl">{selected.name}</h3><p className="break-all text-sm text-muted-foreground">SKU {selected.sku ?? "—"} · {selected.barcode ?? "Sin código"}</p></div><div className="grid grid-cols-2 gap-4 border-y border-border py-4"><div><p className="text-xs text-muted-foreground">Stock guardado</p><p className="text-xl font-semibold">{selected.current_stock}</p></div><div><p className="text-xs text-muted-foreground">Precio</p><p className="text-xl font-semibold">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(selected.price ?? 0)}</p></div></div><Button variant="outline" disabled={!workspace.online} onClick={() => navigate(`/app/products?search=${encodeURIComponent(selected.sku || selected.name)}`)}>Abrir catálogo</Button><div className="flex gap-2"><Button variant={type === "entrada" ? "default" : "outline"} onClick={() => setType("entrada")}>Entrada</Button><Button variant={type === "salida" ? "default" : "outline"} onClick={() => setType("salida")}>Salida</Button></div><Label htmlFor="scan-qty">Cantidad</Label><Input id="scan-qty" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /><Button disabled={!workspace.online || saving || workspace.busy} onClick={() => void record()}>{saving ? "Confirmando…" : "Confirmar movimiento"}</Button>{lastMovement && <p role="status" className="text-sm text-primary">{lastMovement}</p>}</> : <p className="py-8 text-sm text-muted-foreground">Ningún producto seleccionado.</p>}</section></div></TabsContent>
      <TabsContent value="documents" className="mt-6"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"><section className="space-y-4"><h3 className="font-display text-xl">Facturas y remitos</h3><Label htmlFor="new-document-type">Tipo de documento</Label><select id="new-document-type" className="h-10 w-full rounded-md border border-input bg-background px-3" value={docType} onChange={e => setDocType(e.target.value as ScanDocument["docType"])}><option>Factura</option><option>Remito</option><option>Comprobante</option></select><div className="flex flex-wrap gap-2"><Button disabled={workspace.busy} onClick={() => fileInput.current?.click()}><Upload className="mr-2 h-4 w-4" />Subir archivo</Button><Button variant="outline" disabled={workspace.busy} onClick={() => cameraInput.current?.click()}><Camera className="mr-2 h-4 w-4" />Tomar foto</Button></div><input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /><input ref={cameraInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /><p className="text-xs text-muted-foreground">JPG, PNG, WebP o PDF · hasta 10 MB.</p><p className="text-sm text-muted-foreground">Revisá el texto antes de confirmar. Este documento no registra compras ni modifica precios o stock. La primera lectura necesita conexión para descargar el reconocimiento de texto.</p></section><section className="min-w-0">{workspace.documents.length === 0 ? <p className="border-t border-border py-8 text-sm text-muted-foreground">Sin documentos en este dispositivo.</p> : workspace.documents.map(d => <DocumentReview key={d.id} draft={d} disabled={workspace.busy} confirm={workspace.confirmDocument} remove={workspace.removeDocument} />)}</section></div></TabsContent>
    </Tabs>
  </div>;
}