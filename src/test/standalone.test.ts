import { describe, it, expect, vi, afterEach } from "vitest";
import { isStandaloneDisplay, standaloneEntryPath, shouldBlockLanding } from "@/lib/standalone";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("standalone (app instalada)", () => {
  it("standaloneEntryPath manda a /login sin sesión", () => {
    expect(standaloneEntryPath(false)).toBe("/login");
  });

  it("standaloneEntryPath manda al workspace con sesión activa", () => {
    expect(standaloneEntryPath(true)).toBe("/app/dashboard");
  });

  it("shouldBlockLanding bloquea la landing solo en app instalada", () => {
    expect(shouldBlockLanding(true, "/")).toBe(true);
    expect(shouldBlockLanding(true, "/app/dashboard")).toBe(false);
    expect(shouldBlockLanding(false, "/")).toBe(false);
  });

  it("isStandaloneDisplay detecta display-mode: standalone", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true })
    );
    expect(isStandaloneDisplay()).toBe(true);
  });

  it("isStandaloneDisplay es false en navegador normal", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false })
    );
    expect(isStandaloneDisplay()).toBe(false);
  });
});
