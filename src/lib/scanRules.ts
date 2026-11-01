import type { Product } from "@/types/database";

export const SCAN_COOLDOWN_MS = 2000;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export function findScannedProduct(products: Product[], code: string) {
  const value = code.trim();
  return products.find(p => p.barcode === value || p.sku === value);
}
export function validateScanDocument(file: Pick<File, "size" | "type" | "name">) {
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("El archivo supera los 10 MB.");
  if (!/\.(jpe?g|png|webp|pdf)$/i.test(file.name) || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
    throw new Error("Seleccioná una imagen JPG, PNG, WebP o un PDF.");
  }
}
export function createScanGate() {
  let lastCode = "";
  let lastTime = -Infinity;
  return (code: string, time = Date.now()) => {
    if (code === lastCode && time - lastTime < SCAN_COOLDOWN_MS) return false;
    lastCode = code; lastTime = time;
    return true;
  };
}