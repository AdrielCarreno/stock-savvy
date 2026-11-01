import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScanDatabase, type ScanDocument } from "@/lib/scanLocal";
import { validateScanDocument } from "@/lib/scanRules";
import { friendlyError } from "@/lib/errors";
import type { Product } from "@/types/database";

export function useScanWorkspace() {
  const { user, profile } = useAuth();
  const companyId = profile?.company_id;
  const userId = user?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<ScanDocument[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const dbRef = useRef<ScanDatabase | null>(null);
  const active = useRef(false);

  const refreshLocal = useCallback(async (db: ScanDatabase) => {
    const [catalog, drafts] = await Promise.all([db.products.toArray(), db.documents.orderBy("createdAt").reverse().toArray()]);
    if (dbRef.current !== db) return;
    setProducts(catalog); setDocuments(drafts);
  }, []);

  const sync = useCallback(async () => {
    const db = dbRef.current;
    if (!db || !companyId || !userId || !navigator.onLine || active.current) return;
    active.current = true; setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user.id !== userId) return;
      // A complete paginated snapshot avoids silently dropping products after 1,000 rows.
      const catalog: Product[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error: fetchError } = await supabase.from("products").select("*").eq("company_id", companyId).order("id").range(from, from + 999);
        if (fetchError) throw fetchError;
        catalog.push(...(data ?? []) as Product[]);
        if (!data || data.length < 1000) break;
      }
      if (dbRef.current !== db) return;
      await db.transaction("rw", db.products, async () => { await db.products.clear(); await db.products.bulkPut(catalog); });
      await refreshLocal(db);
      const drafts = await db.documents.toArray();
      for (const draft of drafts) {
        if (dbRef.current !== db || !navigator.onLine) break;
        try {
          if (draft.status === "pending") {
            setProgress(0);
            const { recognizeDocument } = await import("@/lib/documentOcr");
            const text = await recognizeDocument(draft.file, value => { if (dbRef.current === db) setProgress(value); });
            if (dbRef.current !== db) break;
            await db.documents.update(draft.id, { text, status: "review", error: null });
          } else if (draft.status === "confirmed" && draft.confirmedAt) {
            const path = `${companyId}/scans/${draft.id}/document.${draft.mime === "application/pdf" ? "pdf" : draft.mime.split("/")[1]}`;
            const { error: uploadError } = await supabase.storage.from("operation-docs").upload(path, draft.file, { contentType: draft.mime, upsert: true });
            if (uploadError) throw uploadError;
            if (dbRef.current !== db) break;
            const { error: rowError } = await supabase.from("scan_documents").upsert({
              id: draft.id, company_id: companyId, uploaded_by: userId,
              file_name: draft.fileName, file_path: path, file_size: draft.file.size,
              doc_type: draft.docType, reviewed_text: draft.text, confirmed_at: draft.confirmedAt,
            });
            if (rowError) throw rowError;
            await db.documents.update(draft.id, { status: "uploaded", error: null });
          }
        } catch (err) {
          if (dbRef.current === db) await db.documents.update(draft.id, { error: friendlyError(err, "No se pudo procesar. Reintentá con conexión.") });
        }
        if (dbRef.current === db) await refreshLocal(db);
      }
      if (dbRef.current === db) setError(null);
    } catch (err) { if (dbRef.current === db) setError(friendlyError(err, "No se pudo sincronizar. La copia local sigue disponible.")); }
    finally { active.current = false; if (dbRef.current === db) setBusy(false); }
  }, [companyId, userId, refreshLocal]);

  useEffect(() => {
    setProducts([]); setDocuments([]); setError(null); setBusy(false);
    if (!companyId || !userId) return;
    const db = new ScanDatabase(companyId, userId);
    dbRef.current = db;
    void refreshLocal(db).then(() => sync()).catch(err => setError(friendlyError(err, "No se pudo abrir el almacenamiento del dispositivo.")));
    const reconnect = () => { setOnline(navigator.onLine); if (navigator.onLine) void sync(); };
    window.addEventListener("online", reconnect); window.addEventListener("offline", reconnect);
    const timer = window.setInterval(() => { void sync(); }, 30000);
    return () => {
      dbRef.current = null; db.close();
      window.removeEventListener("online", reconnect); window.removeEventListener("offline", reconnect); window.clearInterval(timer);
    };
  }, [companyId, userId, sync, refreshLocal]);

  const addDocument = async (file: File, docType: ScanDocument["docType"]) => {
    const db = dbRef.current;
    if (!db) throw new Error("Esperá a que se cargue tu negocio.");
    validateScanDocument(file);
    const draft: ScanDocument = { id: crypto.randomUUID(), file, fileName: file.name, mime: file.type, createdAt: new Date().toISOString(), text: "", docType, status: "pending", error: null };
    await db.documents.add(draft); await refreshLocal(db); void sync();
  };
  const confirmDocument = async (id: string, text: string, docType: ScanDocument["docType"]) => {
    const db = dbRef.current;
    if (!db) return;
    await db.documents.update(id, { text, docType, status: "confirmed", confirmedAt: new Date().toISOString(), error: null });
    await refreshLocal(db); void sync();
  };
  const removeDocument = async (id: string) => {
    const db = dbRef.current;
    if (!db || busy) return;
    await db.documents.delete(id); await refreshLocal(db);
  };
  const readDocument = async (id: string) => {
    const db = dbRef.current;
    if (!db || active.current) return;
    const draft = await db.documents.get(id);
    if (!draft || draft.status !== "pending") return;
    active.current = true; setBusy(true); setProgress(0);
    try {
      const { recognizeDocument } = await import("@/lib/documentOcr");
      const text = await recognizeDocument(draft.file, setProgress);
      if (dbRef.current === db) await db.documents.update(id, { text, status: "review", error: null });
    } catch (err) {
      if (dbRef.current === db) await db.documents.update(id, { error: friendlyError(err, "La lectura no está disponible sin conexión todavía. El original sigue guardado.") });
    } finally {
      active.current = false;
      if (dbRef.current === db) { setBusy(false); await refreshLocal(db); }
    }
  };
  return { products, documents, online, busy, progress, error, sync, addDocument, confirmDocument, removeDocument, readDocument };
}