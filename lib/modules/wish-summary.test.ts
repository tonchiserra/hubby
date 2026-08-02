import { describe, expect, it } from "vitest";
import { buildWishesSummary } from "@/app/(app)/deseos/summary";

describe("buildWishesSummary", () => {
  it("queda en cero cuando no hay deseos cargados", () => {
    const s = buildWishesSummary({
      proximos: [],
      proximosCount: 0,
      pendientesCount: 0,
      total: 0,
    });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Sin deseos todavía");
    expect(s.preview).toEqual([]);
  });

  it("una pila de deseos sin decidir no reclama nada", () => {
    const s = buildWishesSummary({
      proximos: [],
      proximosCount: 0,
      pendientesCount: 12,
      total: 12,
    });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("12 en la lista");
    expect(s.preview).toEqual([]);
  });

  it("avisa cuando ya te compraste todo", () => {
    const s = buildWishesSummary({
      proximos: [],
      proximosCount: 0,
      pendientesCount: 0,
      total: 5,
    });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Todo comprado");
  });

  it("usa la cantidad de próximos como urgencia", () => {
    const s = buildWishesSummary({
      proximos: [
        { title: "Auriculares", price: 120000 },
        { title: "Silla", price: 340000 },
      ],
      proximosCount: 2,
      pendientesCount: 9,
      total: 15,
    });

    expect(s.urgency).toBe(2);
    expect(s.detail).toBe("2 para comprar");
    expect(s.preview).toEqual([
      "Auriculares · $ 120.000",
      "Silla · $ 340.000",
    ]);
  });

  it("muestra el deseo sin precio cuando todavía no lo averiguaste", () => {
    const s = buildWishesSummary({
      proximos: [{ title: "Bicicleta", price: null }],
      proximosCount: 1,
      pendientesCount: 3,
      total: 3,
    });

    expect(s.preview).toEqual(["Bicicleta"]);
    expect(s.detail).toBe("1 para comprar");
  });

  it("la urgencia refleja el total de próximos, no cuántos entran en el preview", () => {
    const s = buildWishesSummary({
      proximos: [
        { title: "Uno", price: null },
        { title: "Dos", price: null },
        { title: "Tres", price: null },
      ],
      proximosCount: 7,
      pendientesCount: 20,
      total: 25,
    });

    expect(s.urgency).toBe(7);
    expect(s.preview).toHaveLength(3);
    expect(s.detail).toBe("7 para comprar");
  });

  it("los centavos se muestran solo cuando los hay", () => {
    const s = buildWishesSummary({
      proximos: [
        { title: "Cable", price: 1299.5 },
        { title: "Teclado", price: 89000 },
      ],
      proximosCount: 2,
      pendientesCount: 2,
      total: 2,
    });

    expect(s.preview).toEqual(["Cable · $ 1.299,50", "Teclado · $ 89.000"]);
  });
});
