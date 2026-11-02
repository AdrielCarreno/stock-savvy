import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PosRegister } from "@/components/pos/PosRegister";

vi.mock("@/hooks/useProducts", () => ({ useProducts: () => ({ loading: false, refresh: vi.fn(), products: [{ id: "test-product", name: "Producto de prueba", sku: "TEST", barcode: "7791234567890", current_stock: 5, price: 100 }] }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ profile: null, company: null }) }));
vi.mock("@/hooks/usePos", async importOriginal => ({ ...await importOriginal<typeof import("@/hooks/usePos")>(), usePos: () => ({ createSale: vi.fn() }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [] }) }) }) } }));
vi.mock("@/components/operations/BarcodeCamera", () => ({ BarcodeCamera: ({ onCode }: { onCode: (code: string) => void }) => <button onClick={() => onCode("7791234567890")}>Lectura de cámara</button> }));

afterEach(cleanup);
describe("carrito conectado a cámara", () => {
  it("agrega una unidad, evita duplicados continuos y deja cobrar con la cámara detenida", () => {
    render(<MemoryRouter initialEntries={["/app/pos?scan=1"]}><PosRegister /></MemoryRouter>);
    fireEvent.click(screen.getByText("Lectura de cámara"));
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Lectura de cámara"));
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Escanear otra unidad"));
    fireEvent.click(screen.getByText("Lectura de cámara"));
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cobrar (F2)" }));
    expect(screen.queryByText("Lectura de cámara")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});