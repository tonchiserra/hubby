import type { ResetKind } from "@/lib/supabase/types";

/**
 * Las reglas de reinicio, en un solo lugar y sin base de datos.
 *
 * Todo lo que decide *cuándo* una lista vuelve a pendiente vive acá, en
 * funciones puras sobre fechas `YYYY-MM-DD`. Se eligió TypeScript y no una
 * función de Postgres justamente por esto: es la parte del módulo que más fácil
 * se equivoca -meses de 30 días, febrero, fin de año- y acá se puede probar
 * cada borde sin levantar una base.
 *
 * Las fechas se manejan como texto y no como `Date` porque son fechas de
 * calendario, no instantes: "el 1 de septiembre" no tiene hora. Comparar
 * `"2026-09-01" > "2026-08-31"` funciona tal cual al estar en ISO con ceros.
 */

/**
 * La zona horaria de la app. hubby es de una sola persona, así que hay una sola
 * zona y no hace falta guardarla por usuario.
 *
 * Importa más de lo que parece: sin esto, "el 1 de cada mes" se dispararía a
 * las 21:00 del último día del mes anterior, que es cuando cambia la fecha en
 * UTC. Las tildes se borrarían la noche anterior.
 */
export const TZ = "America/Argentina/Buenos_Aires";

export type ResetRule = {
  reset_kind: ResetKind;
  reset_day: number | null;
  reset_month: number | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const fecha = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Día 0 del mes siguiente es el último del mes pedido. `m` es 1-based. */
const diasDelMes = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Qué día es hoy acá, sin importar dónde corra el servidor. */
export function hoyLocal(ahora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const parte = (tipo: "year" | "month" | "day") =>
    partes.find((p) => p.type === tipo)?.value ?? "";

  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

/**
 * La última vez que la regla se cumplió, en o antes de `hoy`. `null` si la
 * lista no se reinicia.
 *
 * Mira hacia atrás y no hacia adelante a propósito: la pregunta que importa no
 * es cuándo toca el próximo reinicio, sino si el último ya pasó sin aplicarse.
 * Así una lista que estuvo tres meses sin abrirse se reinicia una sola vez, con
 * la fecha correcta, en lugar de tres veces o ninguna.
 */
export function ultimoReinicio(regla: ResetRule, hoy: string): string | null {
  const [y, m, d] = hoy.split("-").map(Number);
  const dia = regla.reset_day;

  switch (regla.reset_kind) {
    case "nunca":
      return null;

    case "semanal": {
      if (dia === null) return null;
      // getUTCDay() devuelve 0 = domingo, la misma numeración que se guarda.
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      const atras = (dow - dia + 7) % 7;
      const t = new Date(Date.UTC(y, m - 1, d - atras));
      return fecha(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    }

    case "mensual": {
      if (dia === null) return null;
      // Recortado al último día del mes: el 31 en un mes de 30 es el 30, que es
      // lo que quiere decir alguien que eligió "fin de mes".
      const esteMes = Math.min(dia, diasDelMes(y, m));
      if (d >= esteMes) return fecha(y, m, esteMes);

      const [ay, am] = m === 1 ? [y - 1, 12] : [y, m - 1];
      return fecha(ay, am, Math.min(dia, diasDelMes(ay, am)));
    }

    case "anual": {
      const mes = regla.reset_month;
      if (dia === null || mes === null) return null;

      const esteAnio = fecha(y, mes, Math.min(dia, diasDelMes(y, mes)));
      if (esteAnio <= hoy) return esteAnio;

      // 29 de febrero en un año que no es bisiesto cae en el 28.
      return fecha(y - 1, mes, Math.min(dia, diasDelMes(y - 1, mes)));
    }
  }
}

/**
 * La fecha que hay que marcar si la lista tiene un reinicio pendiente, o `null`
 * si está al día.
 *
 * Devuelve la fecha del reinicio y no `true` para que quien lo aplique guarde
 * exactamente esa marca: si guardara "hoy", un reinicio atrasado se registraría
 * con una fecha que no es la que le tocaba.
 */
export function reinicioPendiente(
  lista: ResetRule & { last_reset_on: string },
  hoy: string,
): string | null {
  const ultimo = ultimoReinicio(lista, hoy);
  return ultimo !== null && ultimo > lista.last_reset_on ? ultimo : null;
}

const DIAS = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Cómo se le cuenta la regla al usuario, abajo de su lista. */
export function describirRegla(regla: ResetRule): string {
  const dia = regla.reset_day;

  switch (regla.reset_kind) {
    case "nunca":
      return "Lo que marques queda marcado.";

    case "semanal":
      return dia === null
        ? "Sin reinicio."
        : `Todo vuelve a pendiente los ${DIAS[dia]}.`;

    case "mensual": {
      if (dia === null) return "Sin reinicio.";
      // Del 29 en adelante no todos los meses tienen ese día, y el recorte al
      // último es justo lo que no se adivina mirando el número.
      const aclaracion =
        dia > 28 ? ", o el último día si el mes no llega" : "";
      return `Todo vuelve a pendiente el ${dia} de cada mes${aclaracion}.`;
    }

    case "anual": {
      const mes = regla.reset_month;
      if (dia === null || mes === null) return "Sin reinicio.";
      return `Todo vuelve a pendiente cada ${dia} de ${MESES[mes - 1]}.`;
    }
  }
}

/** Etiqueta corta de la regla, para el editor. */
export const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const NOMBRES_MES = MESES;
