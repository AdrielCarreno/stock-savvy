import { fmtARS, payLabel, type CartLine, type PaymentSplit } from "@/hooks/usePos";

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export type TicketData = {
  company: string;
  seller: string;
  customer?: string | null;
  date: Date;
  reference?: string | null;
  lines: { name: string; quantity: number; unit_price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: PaymentSplit[];
  received?: number | null;
  change?: number | null;
};

export function buildTicketHtml(t: TicketData) {
  const rows = t.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.name)}<br><small>${l.quantity} x ${fmtARS(l.unit_price)}</small></td><td class="r">${fmtARS(
          l.quantity * l.unit_price
        )}</td></tr>`
    )
    .join("");
  const pays = t.payments.map((p) => `<div class="row"><span>${esc(payLabel(p.method))}</span><span>${fmtARS(p.amount)}</span></div>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket de venta</title>
<style>
body{font-family:ui-monospace,Menlo,Consolas,monospace;max-width:320px;margin:0 auto;padding:12px;color:#111}
h1{font-size:15px;text-align:center;margin:0 0 2px}
.muted{color:#666;font-size:11px;text-align:center}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}
td{padding:3px 0;vertical-align:top;border-bottom:1px dashed #ddd}
.r{text-align:right;white-space:nowrap}
.row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.total{font-size:15px;font-weight:700;border-top:1px solid #111;margin-top:6px;padding-top:6px}
small{color:#666}
@media print{@page{margin:6mm}}
</style></head><body>
<h1>${esc(t.company)}</h1>
<div class="muted">Ticket de venta${t.reference ? ` · ${esc(t.reference)}` : ""}</div>
<div class="muted">${t.date.toLocaleString("es-AR")}</div>
<div class="muted">Vendedor: ${esc(t.seller)} · Cliente: ${esc(t.customer || "Consumidor final")}</div>
<table>${rows}</table>
<div class="row"><span>Subtotal</span><span>${fmtARS(t.subtotal)}</span></div>
${t.discount ? `<div class="row"><span>Descuento</span><span>-${fmtARS(t.discount)}</span></div>` : ""}
${t.tax ? `<div class="row"><span>Impuestos</span><span>${fmtARS(t.tax)}</span></div>` : ""}
<div class="row total"><span>TOTAL</span><span>${fmtARS(t.total)}</span></div>
${pays}
${t.received != null ? `<div class="row"><span>Recibido</span><span>${fmtARS(t.received)}</span></div>` : ""}
${t.change != null ? `<div class="row"><span>Vuelto</span><span>${fmtARS(t.change)}</span></div>` : ""}
<p class="muted" style="margin-top:14px">¡Gracias por su compra!</p>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
}

export function printTicket(t: TicketData) {
  const w = window.open("", "_blank", "width=400,height=640");
  if (!w) return false;
  w.document.write(buildTicketHtml(t));
  w.document.close();
  return true;
}

export type { CartLine };
