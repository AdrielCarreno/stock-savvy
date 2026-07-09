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

// Header labels visible in the Products table (excluding "Acciones") + form-only fields.
// Multiple variants map to the same canonical field.
type Field = keyof ProductInput | "warehouse" | "ignore";
const HEADER_MAP: Record<string, Field> = {
  // Producto / Nombre
  producto: "name",
  nombre: "name",
  name: "name",
  // SKU
  sku: "sku",
  codigo: "sku",
  código: "sku",
  // Categoría
  categoria: "category",
  categoría: "category",
  category: "category",
  // Depósito (accepted, currently informational: goes to default warehouse)
  deposito: "warehouse",
  depósito: "warehouse",
  warehouse: "warehouse",
  // P. Costo
  "p. costo": "cost",
  "p costo": "cost",
  costo: "cost",
  "precio costo": "cost",
  cost: "cost",
  // P. Mayorista
  "p. mayorista": "price_wholesale",
  "p mayorista": "price_wholesale",
  "precio mayorista": "price_wholesale",
  mayorista: "price_wholesale",
  // P. Minorista
  "p. minorista": "price_retail",
  "p minorista": "price_retail",
  "precio minorista": "price_retail",
  minorista: "price_retail",
  precio: "price_retail",
  price: "price_retail",
  // Stock
  stock: "current_stock",
  "stock actual": "current_stock",
  current_stock: "current_stock",
  // Mín. (stock mínimo)
  "mín.": "min_stock",
  "min.": "min_stock",
  "min": "min_stock",
  mín: "min_stock",
  "stock minimo": "min_stock",
  "stock mínimo": "min_stock",
  min_stock: "min_stock",
  // Optional form fields
  unidad: "unit",
  unit: "unit",
  descripcion: "description",
  descripción: "description",
  description: "description",
  cliente: "client",
  client: "client",
};

const normalize = (s: string) =>
  s.toString().trim().toLowerCase().replace(/\s+/g, " ");

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
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
      client: null,
      unit: "unidad",
      current_stock: 0,
      min_stock: 0,
      price: 0,
      price_wholesale: 0,
      price_retail: 0,
      cost: 0,
    };

    for (const [k, v] of Object.entries(rec)) {
      const field = HEADER_MAP[normalize(k)];
      if (!field || field === "ignore" || field === "warehouse") continue;
      const val = typeof v === "string" ? v.trim() : v;

      if (field === "name") data.name = String(val ?? "");
      else if (field === "sku") data.sku = val ? String(val).toUpperCase() : null;
      else if (field === "category") data.category = val ? String(val) : null;
      else if (field === "client") data.client = val ? String(val) : null;
      else if (field === "unit") data.unit = val ? String(val) : "unidad";
      else if (field === "description") data.description = val ? String(val) : null;
      else if (field === "current_stock") data.current_stock = Math.max(0, Math.floor(toNumber(val) ?? 0));
      else if (field === "min_stock") data.min_stock = Math.max(0, Math.floor(toNumber(val) ?? 0));
      else if (field === "price") data.price = toNumber(val) ?? 0;
      else if (field === "price_wholesale") data.price_wholesale = toNumber(val) ?? 0;
      else if (field === "price_retail") data.price_retail = toNumber(val) ?? 0;
      else if (field === "cost") data.cost = toNumber(val) ?? 0;
    }

    // Keep `price` in sync with the retail price for backwards compatibility.
    if ((data.price ?? 0) === 0 && (data.price_retail ?? 0) > 0) {
      data.price = data.price_retail ?? 0;
    }

    const errors: string[] = [];
    if (!data.name?.trim()) errors.push("Nombre vacío");
    if ((data.price ?? 0) < 0) errors.push("Precio negativo");
    if ((data.cost ?? 0) < 0) errors.push("Costo negativo");

    return { rowNumber: i + 2, data, errors };
  });

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

// Template columns match exactly the visible headers of the Products table
// (excluding "Acciones"): Producto, SKU, Categoría, Depósito, P. Costo,
// P. Mayorista, P. Minorista, Stock, Mín.
export function downloadTemplate() {
  const data = [
    {
      "Producto": "Aceite Girasol 1.5L",
      "SKU": "ACE-001",
      "Categoría": "Aceites",
      "Depósito": "Principal",
      "P. Costo": 1200,
      "P. Mayorista": 1500,
      "P. Minorista": 1800,
      "Stock": 24,
      "Mín.": 10,
    },
    {
      "Producto": "Harina 000 1kg",
      "SKU": "HAR-001",
      "Categoría": "Harinas",
      "Depósito": "Principal",
      "P. Costo": 700,
      "P. Mayorista": 950,
      "P. Minorista": 1100,
      "Stock": 50,
      "Mín.": 15,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data, {
    header: ["Producto", "SKU", "Categoría", "Depósito", "P. Costo", "P. Mayorista", "P. Minorista", "Stock", "Mín."],
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla-productos.xlsx");
}
