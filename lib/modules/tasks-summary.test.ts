import { describe, expect, it } from "vitest";
import { buildTasksSummary } from "@/app/(app)/tareas/summary";

describe("buildTasksSummary", () => {
  it("queda en cero cuando no hay listas", () => {
    const s = buildTasksSummary({ pendientes: [], listas: 0 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Sin listas todavía");
    expect(s.preview).toEqual([]);
  });

  it("no reclama nada cuando está todo hecho", () => {
    const s = buildTasksSummary({ pendientes: [], listas: 2 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Todo hecho · 2 listas");
    expect(s.preview).toEqual([]);
  });

  it("usa la cantidad de pendientes como urgencia", () => {
    const s = buildTasksSummary({
      pendientes: ["Pagar alquiler", "Pagar luz"],
      listas: 1,
    });

    expect(s.urgency).toBe(2);
    expect(s.detail).toBe("2 pendientes");
    expect(s.preview).toEqual(["Pagar alquiler", "Pagar luz"]);
  });

  it("la urgencia refleja el total, no cuántos entran en el preview", () => {
    const s = buildTasksSummary({
      pendientes: ["Uno", "Dos", "Tres", "Cuatro", "Cinco"],
      listas: 2,
    });

    expect(s.urgency).toBe(5);
    expect(s.preview).toHaveLength(3);
  });

  it("habla en singular cuando hay una sola de cada cosa", () => {
    expect(buildTasksSummary({ pendientes: ["Pagar luz"], listas: 1 }).detail).toBe(
      "1 pendiente",
    );
    expect(buildTasksSummary({ pendientes: [], listas: 1 }).detail).toBe(
      "Todo hecho · 1 lista",
    );
  });
});
