export type IvaCondition = "responsable_inscripto" | "monotributo" | "exento";
export type ReceiverCondition = IvaCondition | "consumidor_final";
export type VoucherType = "FA" | "FB" | "FC";

export const IVA_RATES = [0, 2.5, 5, 10.5, 21, 27] as const;

export const VOUCHER_LABELS: Record<string, string> = {
  FA: "Factura A", FB: "Factura B", FC: "Factura C",
  NCA: "Nota de crédito A", NCB: "Nota de crédito B", NCC: "Nota de crédito C",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", pending: "Enviando", authorized: "Autorizada",
  rejected: "Rechazada", indeterminate: "Sin confirmar", conflict: "En conflicto",
};

/** Valida un CUIT/CUIL con su dígito verificador (módulo 11). */
export function isValidCuit(raw: string): boolean {
  const cuit = raw.replace(/\D/g, "");
  if (cuit.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(cuit[i]), 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false;
  return check === Number(cuit[10]);
}

/** Tipo de comprobante según la condición IVA del emisor y del receptor. */
export function voucherTypeFor(issuer: IvaCondition, receiver: ReceiverCondition): VoucherType {
  if (issuer !== "responsable_inscripto") return "FC";
  return receiver === "responsable_inscripto" || receiver === "monotributo" ? "FA" : "FB";
}

export interface FiscalLineInput {
  description: string;
  quantity: number;
  /** Precio unitario final (IVA incluido). */
  unitPrice: number;
  discount?: number;
  ivaRate: number;
}

export interface FiscalLine extends FiscalLineInput {
  discount: number;
  netAmount: number;
  ivaAmount: number;
}

export interface FiscalTotals {
  lines: FiscalLine[];
  net: number;
  iva: number;
  exempt: number;
  total: number;
}

const toCents = (n: number) => Math.round(n * 100);

/**
 * Desglosa importes finales (IVA incluido) en neto + IVA, en centavos enteros
 * para que neto + IVA sea exactamente el total de cada línea.
 * Emisores no inscriptos (Factura C) no discriminan IVA.
 */
export function computeFiscalTotals(input: FiscalLineInput[], issuer: IvaCondition): FiscalTotals {
  if (input.length === 0) throw new Error("Agregá al menos un producto.");
  let net = 0, iva = 0, exempt = 0;
  const lines = input.map((l) => {
    if (!(l.quantity > 0)) throw new Error(`Cantidad inválida en "${l.description}".`);
    if (l.unitPrice < 0 || (l.discount ?? 0) < 0) throw new Error(`Importe inválido en "${l.description}".`);
    if (!(IVA_RATES as readonly number[]).includes(l.ivaRate)) throw new Error(`Alícuota inválida en "${l.description}".`);
    const gross = Math.round(toCents(l.unitPrice) * l.quantity) - toCents(l.discount ?? 0);
    if (gross < 0) throw new Error(`El descuento supera el importe en "${l.description}".`);
    const rate = issuer === "responsable_inscripto" ? l.ivaRate : 0;
    let lineNet = gross, lineIva = 0;
    if (rate > 0) {
      lineNet = Math.round((gross * 100) / (100 + rate));
      lineIva = gross - lineNet;
      net += lineNet; iva += lineIva;
    } else if (issuer === "responsable_inscripto") {
      exempt += gross;
    } else {
      net += gross;
    }
    return { ...l, discount: l.discount ?? 0, ivaRate: rate, netAmount: lineNet / 100, ivaAmount: lineIva / 100 };
  });
  return { lines, net: net / 100, iva: iva / 100, exempt: exempt / 100, total: (net + iva + exempt) / 100 };
}

/** Bloquea facturar una venta si el desglose no coincide exactamente con el total cobrado. */
export function assertMatchesSaleTotal(totals: FiscalTotals, saleTotal: number) {
  if (toCents(totals.total) !== toCents(saleTotal)) {
    throw new Error(
      `El total fiscal ($${totals.total.toFixed(2)}) no coincide con el de la venta ($${saleTotal.toFixed(2)}). Revisá descuentos o impuestos de la venta antes de facturar.`
    );
  }
}
