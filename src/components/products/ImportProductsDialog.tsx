import { useRef, useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseFile, downloadTemplate, type ParseResult } from "@/lib/productImport";
import type { ProductInput } from "@/hooks/useProducts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSkus: Set<string>;
  onImport: (rows: ProductInput[]) => Promise<{ success: number; failed: number }>;
};

export function ImportProductsDialog({ open, onOpenChange, existingSkus, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setImporting(false);
    setParsing(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (o: boolean) => {
    if (!o && !importing) reset();
    onOpenChange(o);
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      const parsed = await parseFile(f);
      // Mark existing-SKU rows as errors too
      parsed.rows.forEach((r) => {
        if (r.data.sku && existingSkus.has(r.data.sku)) {
          r.errors.push("SKU ya existe en tu inventario");
        }
      });
      const validCount = parsed.rows.filter((r) => r.errors.length === 0).length;
      setResult({ ...parsed, validCount, invalidCount: parsed.rows.length - validCount });
    } catch (e) {
      toast.error("No se pudo leer el archivo. Verificá el formato (CSV/XLSX).");
      reset();
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;
    const valid = result.rows.filter((r) => r.errors.length === 0).map((r) => r.data);
    if (valid.length === 0) {
      toast.error("No hay filas válidas para importar");
      return;
    }
    setImporting(true);
    setProgress(5);
    const res = await onImport(valid);
    setProgress(100);
    setImporting(false);
    if (res.failed === 0) {
      toast.success(`${res.success} productos importados correctamente`);
    } else {
      toast.warning(`${res.success} importados, ${res.failed} fallaron`);
    }
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar productos</DialogTitle>
          <DialogDescription>
            Subí un archivo CSV o Excel (.xlsx) para cargar tu inventario en lote.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Procesando archivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Arrastrá el archivo o hacé click para seleccionar</p>
                  <p className="text-xs text-muted-foreground">CSV, XLSX o XLS · hasta 5.000 productos</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">¿Primera vez?</p>
                  <p className="text-xs text-muted-foreground">
                    Descargá la plantilla con las columnas correctas: nombre, sku, categoria, unidad, stock,
                    stock_minimo, costo, precio.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0 gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Plantilla
                </Button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">{result.rows.length} filas detectadas</p>
              </div>
              {!importing && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-xs text-muted-foreground">Válidos</p>
                </div>
                <p className="text-2xl font-bold mt-1">{result.validCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-muted-foreground">Con errores</p>
                </div>
                <p className="text-2xl font-bold mt-1">{result.invalidCount}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">Fila</th>
                    <th className="px-2 py-2 text-left font-semibold">Nombre</th>
                    <th className="px-2 py-2 text-left font-semibold">SKU</th>
                    <th className="px-2 py-2 text-right font-semibold">Stock</th>
                    <th className="px-2 py-2 text-right font-semibold">Precio</th>
                    <th className="px-2 py-2 text-left font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.rows.slice(0, 100).map((r) => (
                    <tr key={r.rowNumber} className={r.errors.length > 0 ? "bg-destructive/5" : ""}>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.rowNumber}</td>
                      <td className="px-2 py-1.5 truncate max-w-[180px]">{r.data.name || "—"}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.data.sku || "—"}</td>
                      <td className="px-2 py-1.5 text-right">{r.data.current_stock}</td>
                      <td className="px-2 py-1.5 text-right">{r.data.price ?? 0}</td>
                      <td className="px-2 py-1.5">
                        {r.errors.length === 0 ? (
                          <Badge variant="secondary" className="text-[10px]">OK</Badge>
                        ) : (
                          <span className="text-destructive text-[10px]">{r.errors[0]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 100 && (
                <div className="bg-muted/30 px-2 py-1.5 text-center text-xs text-muted-foreground">
                  Mostrando las primeras 100 filas de {result.rows.length}
                </div>
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">Importando productos...</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Cancelar
          </Button>
          {result && (
            <Button
              onClick={handleImport}
              disabled={importing || result.validCount === 0}
              className="gradient-primary shadow-primary text-primary-foreground"
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {result.validCount} productos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
