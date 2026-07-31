import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ModuleSummary } from "@/lib/modules/summary";

/** Cuántos productos concretos muestra el panel antes de cortar. */
const PREVIEW_SIZE = 3;

/**
 * Parte pura: dado el conteo y los nombres, arma el resumen. Separada de la
 * consulta para poder probar las reglas sin base de datos.
 */
export function buildGrocerySummary({
  missingNames,
  missingCount,
  total,
}: {
  missingNames: string[];
  missingCount: number;
  total: number;
}): ModuleSummary {
  if (total === 0) {
    return { urgency: 0, detail: "Sin productos todavía", preview: [] };
  }

  if (missingCount === 0) {
    return { urgency: 0, detail: `No falta nada · ${total} en casa`, preview: [] };
  }

  // La urgencia es el total de faltantes, no el largo del preview: con nueve
  // faltantes el módulo tiene que pesar nueve aunque solo se muestren tres.
  return {
    urgency: missingCount,
    detail: `${missingCount} para comprar`,
    preview: missingNames,
  };
}

export async function getGrocerySummary(): Promise<ModuleSummary> {
  const supabase = await createClient();

  const [missing, all] = await Promise.all([
    // count: "exact" junto con limit devuelve el total de coincidencias y solo
    // las primeras filas: una sola ida y vuelta para el número y los nombres.
    supabase
      .from("grocery_items")
      .select("name", { count: "exact" })
      .eq("active", false)
      .order("name", { ascending: true })
      .limit(PREVIEW_SIZE),
    supabase.from("grocery_items").select("*", { count: "exact", head: true }),
  ]);

  if (missing.error || all.error) {
    throw new Error(
      `No se pudo leer el resumen del supermercado: ${
        missing.error?.message ?? all.error?.message
      }`,
    );
  }

  return buildGrocerySummary({
    missingNames: (missing.data ?? []).map((r) => r.name),
    missingCount: missing.count ?? 0,
    total: all.count ?? 0,
  });
}
