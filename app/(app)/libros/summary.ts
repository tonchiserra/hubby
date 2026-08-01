import "server-only";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const anio = new Date().getFullYear();

  const [leyendo, leidos, todos] = await Promise.all([
    supabase
      .from("books")
      .select("title")
      .eq("status", "leyendo")
      .order("title")
      .limit(3),
    supabase
      .from("books")
      .select("*", { count: "exact", head: true })
      .eq("read_year", anio),
    supabase.from("books").select("*", { count: "exact", head: true }),
  ]);

  if (leyendo.error || leidos.error || todos.error) {
    throw new Error("No se pudo leer el resumen de libros");
  }

  return buildBooksSummary({
    leyendo: (leyendo.data ?? []).map((b) => b.title),
    leidosEsteAnio: leidos.count ?? 0,
    total: todos.count ?? 0,
  });
}
