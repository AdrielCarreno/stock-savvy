import Dexie, { type Table } from "dexie";
import type { Product } from "@/types/database";

export interface ScanDocument {
  id: string;
  file: Blob;
  fileName: string;
  mime: string;
  createdAt: string;
  text: string;
  docType: "Factura" | "Remito" | "Comprobante";
  status: "pending" | "review" | "confirmed" | "uploaded";
  error: string | null;
  confirmedAt?: string;
}
export class ScanDatabase extends Dexie {
  products!: Table<Product, string>;
  documents!: Table<ScanDocument, string>;
  constructor(companyId: string, userId: string) {
    super(`onestock_scan_${companyId}_${userId}`);
    this.version(1).stores({ products: "id,barcode,sku", documents: "id,status,createdAt" });
  }
}