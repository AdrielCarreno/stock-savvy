/** Utilidades de exportación a Excel (CSV compatible) y PDF (vía impresión). */

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCsv(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Descarga un CSV con separador ";" (formato que Excel en es-AR abre directo). */
export function exportToCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]) {
  const head = columns.map((c) => escapeCsv(c.header)).join(";");
  const body = rows.map((r) => columns.map((c) => escapeCsv(c.value(r))).join(";"));
  const csv = "\uFEFF" + [head, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Abre el diálogo de impresión con una tabla lista para guardar como PDF. */
export function exportToPdf<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  subtitle?: string
) {
  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) return;
  const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const head = columns.map((c) => `<th>${esc(c.header)}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${esc(c.value(r))}</td>`).join("")}</tr>`)
    .join("");
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:28px;color:#111}
  h1{font-size:18px;margin:0 0 4px}
  p.sub{font-size:12px;color:#666;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
  th{background:#f4f4f5;font-weight:600}
  tr:nth-child(even) td{background:#fafafa}
  @media print{@page{size:A4 landscape;margin:12mm}}
</style></head><body>
<h1>${esc(title)}</h1><p class="sub">${esc(subtitle ?? new Date().toLocaleString("es-AR"))}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
  win.document.close();
}

export const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
