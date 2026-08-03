import { describe, expect, it, vi } from "vitest";
import { RESUMEN_CAIDO, resumenAislado } from "./safe-summary";
import type { ModuleSummary } from "./summary";

const OK: ModuleSummary = {
  urgency: 2,
  detail: "2 para comprar",
  preview: ["Leche", "Yerba"],
};

describe("resumenAislado", () => {
  it("devuelve el resumen cuando la lectura funciona", async () => {
    await expect(resumenAislado("supermercado", async () => OK)).resolves.toEqual(
      OK,
    );
  });

  it("devuelve el resumen caído cuando la lectura falla", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      resumenAislado("deseos", async () => {
        throw new Error(
          "Could not find the table 'public.wishes' in the schema cache",
        );
      }),
    ).resolves.toEqual(RESUMEN_CAIDO);

    // La falla se degrada, pero no se traga: tiene que quedar en el log del
    // servidor o el módulo roto se vuelve invisible para quien lo mantiene.
    expect(consola).toHaveBeenCalled();
    consola.mockRestore();
  });

  it("un módulo roto no se lleva puesto al resto del panel", async () => {
    // Ésta es la regresión del incidente del 2026-08-02: se mergeó el módulo
    // de deseos sin correr su migración, la tabla no existía, su resumen tiraba
    // excepción y el Promise.all del panel rechazaba entero. La home devolvía
    // 500 y -como no hay toolbar ni sidebar- no quedaba forma de llegar a los
    // módulos que sí funcionaban.
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});

    const entradas = await Promise.all([
      resumenAislado("supermercado", async () => OK),
      resumenAislado("deseos", async () => {
        throw new Error("PGRST205");
      }),
      resumenAislado("libros", async () => OK),
    ]);

    expect(entradas).toEqual([OK, RESUMEN_CAIDO, OK]);
    consola.mockRestore();
  });
});
