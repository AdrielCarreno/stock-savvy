import { describe, expect, it } from "vitest";
import { findPosScanProduct } from "@/lib/posScan";
import type { Product } from "@/types/database";

const products = [
  { id: "a", name: "Toalla", barcode: "7791234567890", sku: "T-01" },
  { id: "b", name: "Toalla grande", barcode: "12345670", sku: "T-02" },
] as Product[];

describe("escaneo para Clientes", () => {
  it("identifica el producto por código exacto para el carrito", () => {
    expect(findPosScanProduct(products, " 7791234567890 ").id).toBe("a");
  });
  it("acepta el SKU exacto", () => {
    expect(findPosScanProduct(products, "t-02").id).toBe("b");
  });
  it("no vende otro producto ante un código parcial o desconocido", () => {
    expect(() => findPosScanProduct(products, "779")).toThrow();
    expect(() => findPosScanProduct(products, "Toalla")).toThrow();
  });
  it("no elige arbitrariamente cuando un código está duplicado", () => {
    expect(() => findPosScanProduct([...products, { ...products[1], barcode: "7791234567890" }], "7791234567890")).toThrow("varios productos");
  });
});