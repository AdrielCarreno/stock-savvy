import * as XLSX from "xlsx";
import type { ProductInput } from "@/hooks/useProducts";

export type ParsedRow = {
  rowNumber: number;
  data: ProductInput;
  errors: string[];
};

export type ParseResult = {
  rows: ParsedRow[];
  validCount: number;
  invalidCount: number;
};

// Acceptable header variants → canonical field
const HEADER_MAP: Record<string, keyof ProductInput> = {
  nombre: "name",
  name: "name",
  producto: "name",
  sku: "sku",
  codigo: "sku",
  código: "sku",
  categoria: "category",
  categoría: "category",
  category: "category",
  unidad: "unit",
  unit: "unit",
  stock: "current_stock",
  "stock actual": "current_stock",
  current_stock: "current_stock",
  "stock minimo": "min_stock",
  "stock mínimo": "min_stock",
  min_stock: "min_stock",
  "stock min": "min_stock",
  precio: "price",
  "precio venta": "price",
  price: "price",
  costo: "cost",
  "precio costo": "cost",
  cost: "cost",
  descripcion: "description",
  descripción: "description",
  description: "description",
};

const normalize = (s: string) =>
  s.toString().trim().toLowerCase().replace(/\s+/g, " ");

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export async function parseFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  const rows: ParsedRow[] = raw.map((rec, i) => {
    const data: ProductInput = {
      name: "",
      sku: null,
      category: null,
      unit: "unidad",
      current_stock: 0,
      min_stock: 0,
      price: 0,
      cost: 0,
    };

    for (const [k, v] of Object.entries(rec)) {
      const field = HEADER_MAP[normalize(k)];
      if (!field) continue;
      const val = typeof v === "string" ? v.trim() : v;

      if (field === "name") data.name = String(val ?? "");
      else if (field === "sku") data.sku = val ? String(val).toUpperCase() : null;
      else if (field === "category") data.category = val ? String(val) : null;
      else if (field === "unit") data.unit = val ? String(val) : "unidad";
      else if (field === "description") data.description = val ? String(val) : null;
      else if (field === "current_stock") data.current_stock = Math.max(0, Math.floor(toNumber(val) ?? 0));
      else if (field === "min_stock") data.min_stock = Math.max(0, Math.floor(toNumber(val) ?? 0));
      else if (field === "price") data.price = toNumber(val) ?? 0;
      else if (field === "cost") data.cost = toNumber(val) ?? 0;
    }

    const errors: string[] = [];
    if (!data.name?.trim()) errors.push("Nombre vacío");
    if ((data.price ?? 0) < 0) errors.push("Precio negativo");
    if ((data.cost ?? 0) < 0) errors.push("Costo negativo");

    return { rowNumber: i + 2, data, errors };
  });

  // Detect duplicate SKUs within file
  const seen = new Map<string, number>();
  rows.forEach((r) => {
    const sku = r.data.sku;
    if (!sku) return;
    if (seen.has(sku)) r.errors.push(`SKU duplicado en fila ${seen.get(sku)}`);
    else seen.set(sku, r.rowNumber);
  });

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  return { rows, validCount, invalidCount: rows.length - validCount };
}

export function downloadTemplate() {
  const data = [
    {
      nombre: "Aceite Girasol 1.5L",
      sku: "ACE-001",
      categoria: "Aceites",
      unidad: "unidad",
      stock: 24,
      stock_minimo: 10,
      costo: 1200,
      precio: 1800,
      descripcion: "",
    },
    {
      nombre: "Harina 000 1kg",
      sku: "HAR-001",
      categoria: "Harinas",
      unidad: "unidad",
      stock: 50,
      stock_minimo: 15,
      costo: 700,
      precio: 1100,
      descripcion: "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla-productos.xlsx");
}
