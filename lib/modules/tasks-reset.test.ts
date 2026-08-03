import { describe, expect, it } from "vitest";
import {
  describirRegla,
  hoyLocal,
  reinicioPendiente,
  ultimoReinicio,
} from "@/app/(app)/tareas/reset";

/**
 * Es la parte del módulo que no se puede probar a mano: para ver si el reinicio
 * anual funciona habría que esperar un año. Acá se le pasa el "hoy" como dato.
 */
describe("ultimoReinicio", () => {
  it("una lista sin reinicio no tiene fecha", () => {
    expect(
      ultimoReinicio(
        { reset_kind: "nunca", reset_day: null, reset_month: null },
        "2026-08-03",
      ),
    ).toBeNull();
  });

  describe("mensual", () => {
    const regla = { reset_kind: "mensual" as const, reset_day: 1, reset_month: null };

    it("el mismo día del reinicio ya cuenta como cumplido", () => {
      expect(ultimoReinicio(regla, "2026-08-01")).toBe("2026-08-01");
    });

    it("después del día, el último fue este mes", () => {
      expect(ultimoReinicio(regla, "2026-08-20")).toBe("2026-08-01");
    });

    it("antes del día, el último fue el mes pasado", () => {
      const dia15 = { ...regla, reset_day: 15 };
      expect(ultimoReinicio(dia15, "2026-08-03")).toBe("2026-07-15");
    });

    it("cruza el año hacia atrás en enero", () => {
      const dia20 = { ...regla, reset_day: 20 };
      expect(ultimoReinicio(dia20, "2026-01-05")).toBe("2025-12-20");
    });

    it("el 31 en un mes de 30 cae en el último día", () => {
      const fin = { ...regla, reset_day: 31 };
      expect(ultimoReinicio(fin, "2026-04-30")).toBe("2026-04-30");
      expect(ultimoReinicio(fin, "2026-04-15")).toBe("2026-03-31");
    });

    it("el 30 en febrero cae en el 28", () => {
      const fin = { ...regla, reset_day: 30 };
      expect(ultimoReinicio(fin, "2026-02-28")).toBe("2026-02-28");
    });
  });

  describe("semanal", () => {
    // 2026-08-03 es lunes.
    const lunes = { reset_kind: "semanal" as const, reset_day: 1, reset_month: null };

    it("el mismo lunes ya cuenta", () => {
      expect(ultimoReinicio(lunes, "2026-08-03")).toBe("2026-08-03");
    });

    it("el jueves, el último lunes fue tres días atrás", () => {
      expect(ultimoReinicio(lunes, "2026-08-06")).toBe("2026-08-03");
    });

    it("el domingo, el último lunes fue el de la semana que termina", () => {
      expect(ultimoReinicio(lunes, "2026-08-09")).toBe("2026-08-03");
    });

    it("cruza el cambio de mes", () => {
      expect(ultimoReinicio(lunes, "2026-09-02")).toBe("2026-08-31");
    });
  });

  describe("anual", () => {
    const enero = { reset_kind: "anual" as const, reset_day: 1, reset_month: 1 };

    it("después de la fecha, el último fue este año", () => {
      expect(ultimoReinicio(enero, "2026-08-03")).toBe("2026-01-01");
    });

    it("antes de la fecha, el último fue el año pasado", () => {
      const julio = { ...enero, reset_day: 9, reset_month: 7 };
      expect(ultimoReinicio(julio, "2026-03-01")).toBe("2025-07-09");
    });

    it("el 29 de febrero cae en el 28 cuando el año no es bisiesto", () => {
      const bisiesto = { ...enero, reset_day: 29, reset_month: 2 };
      expect(ultimoReinicio(bisiesto, "2026-01-15")).toBe("2025-02-28");
      expect(ultimoReinicio(bisiesto, "2024-06-01")).toBe("2024-02-29");
    });
  });
});

describe("reinicioPendiente", () => {
  const mensual = {
    reset_kind: "mensual" as const,
    reset_day: 1,
    reset_month: null,
  };

  it("no reinicia dos veces el mismo ciclo", () => {
    expect(
      reinicioPendiente({ ...mensual, last_reset_on: "2026-08-01" }, "2026-08-20"),
    ).toBeNull();
  });

  it("reinicia cuando pasó la fecha desde la última vez", () => {
    expect(
      reinicioPendiente({ ...mensual, last_reset_on: "2026-07-01" }, "2026-08-03"),
    ).toBe("2026-08-01");
  });

  it("tres meses sin abrir la app se saldan con un solo reinicio, el que tocaba", () => {
    expect(
      reinicioPendiente({ ...mensual, last_reset_on: "2026-05-01" }, "2026-08-20"),
    ).toBe("2026-08-01");
  });

  it("una lista creada hoy no se reinicia hoy", () => {
    // Se crea el 15 con reinicio el 1: el 1 de este mes ya pasó, pero es
    // anterior a la creación.
    expect(
      reinicioPendiente({ ...mensual, last_reset_on: "2026-08-15" }, "2026-08-15"),
    ).toBeNull();
  });

  it("una lista sin reinicio nunca queda pendiente", () => {
    expect(
      reinicioPendiente(
        {
          reset_kind: "nunca",
          reset_day: null,
          reset_month: null,
          last_reset_on: "2020-01-01",
        },
        "2026-08-03",
      ),
    ).toBeNull();
  });
});

describe("hoyLocal", () => {
  it("usa la fecha de Buenos Aires y no la del servidor", () => {
    // Las 02:30 UTC del 4 son las 23:30 del 3 acá: la lista no se reinicia
    // la noche anterior.
    expect(hoyLocal(new Date("2026-08-04T02:30:00Z"))).toBe("2026-08-03");
  });

  it("cambia de día a la medianoche local", () => {
    expect(hoyLocal(new Date("2026-08-04T03:00:00Z"))).toBe("2026-08-04");
  });
});

describe("describirRegla", () => {
  it("cuenta el día del mes", () => {
    expect(
      describirRegla({ reset_kind: "mensual", reset_day: 1, reset_month: null }),
    ).toBe("Todo vuelve a pendiente el 1 de cada mes.");
  });

  it("aclara el recorte cuando el día puede no existir", () => {
    expect(
      describirRegla({ reset_kind: "mensual", reset_day: 31, reset_month: null }),
    ).toBe(
      "Todo vuelve a pendiente el 31 de cada mes, o el último día si el mes no llega.",
    );
  });

  it("nombra el día de la semana", () => {
    expect(
      describirRegla({ reset_kind: "semanal", reset_day: 1, reset_month: null }),
    ).toBe("Todo vuelve a pendiente los lunes.");
  });

  it("nombra la fecha anual", () => {
    expect(
      describirRegla({ reset_kind: "anual", reset_day: 1, reset_month: 1 }),
    ).toBe("Todo vuelve a pendiente cada 1 de enero.");
  });

  it("una lista común dice que lo marcado queda marcado", () => {
    expect(
      describirRegla({ reset_kind: "nunca", reset_day: null, reset_month: null }),
    ).toBe("Lo que marques queda marcado.");
  });
});
