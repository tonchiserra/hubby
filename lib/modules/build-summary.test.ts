import { describe, expect, it, vi } from "vitest";

// `server-only` es un marcador que lanza al importarse fuera de un Server
// Component, y summary.ts lo lleva porque también consulta la base. Acá solo se
// ejercita la parte pura, así que se neutraliza el marcador.
vi.mock("server-only", () => ({}));

import { buildGrocerySummary } from "@/app/(app)/supermercado/summary";

describe("buildGrocerySummary", () => {
  it("queda en cero cuando no hay productos cargados", () => {
    const s = buildGrocerySummary({ missingNames: [], missingCount: 0, total: 0 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Sin productos todavía");
    expect(s.preview).toEqual([]);
  });

  it("queda en cero cuando no falta nada", () => {
    const s = buildGrocerySummary({ missingNames: [], missingCount: 0, total: 12 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("No falta nada · 12 en casa");
  });

  it("usa la cantidad de faltantes como urgencia", () => {
    const s = buildGrocerySummary({
      missingNames: ["Leche", "Café"],
      missingCount: 2,
      total: 12,
    });

    expect(s.urgency).toBe(2);
    expect(s.detail).toBe("2 para comprar");
    expect(s.preview).toEqual(["Leche", "Café"]);
  });

  it("usa singular cuando falta uno solo", () => {
    const s = buildGrocerySummary({
      missingNames: ["Leche"],
      missingCount: 1,
      total: 12,
    });

    expect(s.detail).toBe("1 para comprar");
    expect(s.urgency).toBe(1);
  });

  it("la urgencia refleja el total de faltantes, no cuántos entran en el preview", () => {
    const s = buildGrocerySummary({
      missingNames: ["Aceite", "Café", "Leche"],
      missingCount: 9,
      total: 20,
    });

    expect(s.urgency).toBe(9);
    expect(s.preview).toHaveLength(3);
    expect(s.detail).toBe("9 para comprar");
  });
});
