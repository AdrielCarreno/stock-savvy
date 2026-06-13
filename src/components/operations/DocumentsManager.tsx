import { friendlyError } from "@/lib/errors";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trash2, Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

type EntityType = "import" | "supplier" | "shipment" | "customs";

interface DocRow {
  id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const DOC_TYPES: Record<EntityType, string[]> = {
  import: ["Invoice", "Packing List", "Contrato", "Otro"],
  supplier: ["Factura", "Lista de precios", "Catálogo", "Contrato", "Otro"],
  shipment: ["BL / AWB", "Booking", "Certificado origen", "Seguro", "Otro"],
  customs: ["Despacho", "DJAI/SIMI", "Certificado", "Liquidación", "Otro"],
};

export function DocumentsManager({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[entityType][0]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: u } = await supabase.from("users").select("company_id").eq("id", user!.id).single();
    if (!u) return;
    setCompanyId(u.company_id);
    const { data, error } = await supabase
      .from("operation_documents" as any)
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) toast.error(friendlyError(error));
    else setDocs((data as any) || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entityId]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_MIME = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "text/csv", "text/plain",
    ]);
    const ALLOWED_EXT = /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|webp|gif|csv|txt)$/i;

    if (file.size > MAX_BYTES) {
      toast.error("El archivo supera el máximo de 10 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!ALLOWED_EXT.test(file.name) || (file.type && !ALLOWED_MIME.has(file.type))) {
      toast.error("Tipo de archivo no permitido. Subí PDF, Office, imágenes o CSV/TXT.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${companyId}/${entityType}/${entityId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("operation-docs").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) { toast.error(friendlyError(upErr)); setUploading(false); return; }
    const { error: insErr } = await supabase.from("operation_documents" as any).insert({
      company_id: companyId,
      entity_type: entityType,
      entity_id: entityId,
      doc_type: docType,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      uploaded_by: user!.id,
    } as any);
    if (insErr) toast.error(friendlyError(insErr));
    else toast.success("Documento subido");
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    load();
  };

  const download = async (d: DocRow) => {
    const { data, error } = await supabase.storage.from("operation-docs").createSignedUrl(d.file_path, 60);
    if (error) return toast.error(friendlyError(error));
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (d: DocRow) => {
    await supabase.storage.from("operation-docs").remove([d.file_path]);
    await supabase.from("operation_documents" as any).delete().eq("id", d.id);
    toast.success("Eliminado");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-end">
        <div className="flex-1 w-full">
          <Label className="text-xs">Tipo de documento</Label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOC_TYPES[entityType].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 w-full">
          <Label className="text-xs">Archivo</Label>
          <Input ref={inputRef} type="file" onChange={onFile} disabled={uploading} />
        </div>
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Sin documentos cargados.</p>
        ) : docs.map(d => (
          <div key={d.id} className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{d.file_name}</p>
              <p className="text-xs text-muted-foreground">{d.doc_type} · {d.file_size ? Math.round(d.file_size / 1024) + " KB" : ""}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
