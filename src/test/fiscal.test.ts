import { describe, it, expect } from "vitest";
import { isValidCuit, voucherTypeFor, computeFiscalTotals, assertMatchesSaleTotal } from "@/lib/fiscal";

describe("fiscal rules", () => {
  it("valida el dígito verificador del CUIT", () => {
    expect(isValidCuit("20-12345678-6")).toBe(true);
    expect(isValidCuit("20123456780")).toBe(false);
    expect(isValidCuit("123")).toBe(false);
  });

  it("elige Factura A, B o C según condición IVA", () => {
    expect(voucherTypeFor("responsable_inscripto", "responsable_inscripto")).toBe("FA");
    expect(voucherTypeFor("responsable_inscripto", "consumidor_final")).toBe("FB");
    expect(voucherTypeFor("monotributo", "responsable_inscripto")).toBe("FC");
  });

  it("desglosa IVA 21% exacto en centavos", () => {
    const t = computeFiscalTotals([{ description: "Vaso", quantity: 3, unitPrice: 121, ivaRate: 21 }], "responsable_inscripto");
    expect(t.net).toBe(300);
    expect(t.iva).toBe(63);
    expect(t.total).toBe(363);
  });

  it("neto + IVA siempre igual al total con redondeo", () => {
    const t = computeFiscalTotals([{ description: "X", quantity: 7, unitPrice: 33.33, discount: 1.11, ivaRate: 10.5 }], "responsable_inscripto");
    expect(Math.round((t.net + t.iva) * 100)).toBe(Math.round(t.total * 100));
    expect(t.total).toBe(232.2);
  });

  it("Factura C no discrimina IVA", () => {
    const t = computeFiscalTotals([{ description: "X", quantity: 1, unitPrice: 100, ivaRate: 21 }], "monotributo");
    expect(t.iva).toBe(0);
    expect(t.net).toBe(100);
  });

  it("bloquea si no coincide con el total de la venta", () => {
    const t = computeFiscalTotals([{ description: "X", quantity: 1, unitPrice: 100, ivaRate: 21 }], "responsable_inscripto");
    expect(() => assertMatchesSaleTotal(t, 90)).toThrow();
    expect(() => assertMatchesSaleTotal(t, 100)).not.toThrow();
  });

  it("rechaza cantidades y alícuotas inválidas", () => {
    expect(() => computeFiscalTotals([{ description: "X", quantity: 0, unitPrice: 1, ivaRate: 21 }], "responsable_inscripto")).toThrow();
    expect(() => computeFiscalTotals([{ description: "X", quantity: 1, unitPrice: 1, ivaRate: 19 }], "responsable_inscripto")).toThrow();
  });
});
