import type { Product } from "@/types/database";

/** Camera reads are exact identifiers, never fuzzy product-name searches. */
export function findPosScanProduct(products: Product[], code: string): Product {
  const value = code.trim().toLowerCase();
  if (!value) throw new Error("Ingresá un código de producto.");
  const matches = products.filter(p => p.barcode?.toLowerCase() === value || p.sku?.toLowerCase() === value);
  if (matches.length === 0) throw new Error("Producto no encontrado. Revisá el código en el catálogo.");
  if (matches.length > 1) throw new Error("El código corresponde a varios productos. Elegí el producto desde el catálogo.");
  return matches[0];
}