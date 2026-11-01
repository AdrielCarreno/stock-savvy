import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { createScanGate, validateScanDocument } from "@/lib/scanRules";
import { ScanDatabase } from "@/lib/scanLocal";

describe("escaneo", () => {
  it("bloquea lecturas repetidas durante 2 segundos", () => {
    const gate = createScanGate();
    expect(gate("7791234567890", 0)).toBe(true);
    expect(gate("7791234567890", 1999)).toBe(false);
    expect(gate("7791234567890", 2000)).toBe(true);
  });
  it("acepta comprobantes de hasta 10 MB y rechaza mayores", () => {
    expect(() => validateScanDocument({ name: "factura.pdf", type: "application/pdf", size: 10485760 })).not.toThrow();
    expect(() => validateScanDocument({ name: "factura.pdf", type: "application/pdf", size: 10485761 })).toThrow();
  });
  it("no acepta archivos ejecutables", () => {
    expect(() => validateScanDocument({ name: "factura.exe", type: "application/octet-stream", size: 10 })).toThrow();
  });
  it("persiste pendientes sin compartir documentos entre empresas ni usuarios", async () => {
    const db = new ScanDatabase("empresa-a", "usuario-a");
    const sameCompany = new ScanDatabase("empresa-a", "usuario-b");
    const otherCompany = new ScanDatabase("empresa-b", "usuario-a");
    await db.documents.add({ id: "real-draft", file: new Blob(["original"]), fileName: "factura.png", mime: "image/png", createdAt: "2026-11-01", text: "", docType: "Factura", status: "pending", error: null });
    db.close(); await db.open();
    expect((await db.documents.get("real-draft"))?.status).toBe("pending");
    expect(await sameCompany.documents.count()).toBe(0);
    expect(await otherCompany.documents.count()).toBe(0);
    await Promise.all([db.delete(), sameCompany.delete(), otherCompany.delete()]);
  });
});