import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";

/**
 * Parte pura: dado lo que está leyendo y cuántos terminó, arma el resumen.
 * Separada de la consulta para poder probar las reglas sin base de datos.
 */
export function buildBooksSummary({
  leyendo,
  leidosEsteAnio,
  total,
}: {
  leyendo: string[];
  leidosEsteAnio: number;
  total: number;
}): ModuleSummary {
  if (total === 0) {
    return { urgency: 0, detail: "Sin libros todavía", preview: [] };
  }

  const detalleAnio =
    leidosEsteAnio === 0
      ? "Ninguno terminado este año"
      : `${leidosEsteAnio} este año`;

  // Un libro nunca es urgente. Lo accionable es lo que tenés empezado, así que
  // la urgencia es cuántos estás leyendo -no cuántos querés leer, que puede ser
  // una pila infinita que no reclama nada.
  if (leyendo.length === 0) {
    return { urgency: 0, detail: detalleAnio, preview: [] };
  }

  return {
    urgency: leyendo.length,
    detail: detalleAnio,
    preview: leyendo,
  };
}

export async function getBooksSummary(): Promise<ModuleSummary> {
  // El año lo calcula la consulta, en la zona de la app. Antes salía de
  // `new Date().getFullYear()` sobre el reloj del servidor, que en Vercel es
  // UTC: el 31 de diciembre a la noche ya contaba el año siguiente.
  const { books } = await getPanelCounters();

  return buildBooksSummary({
    leyendo: books.leyendo,
    leidosEsteAnio: books.leidos_anio,
    total: books.total,
  });
}
