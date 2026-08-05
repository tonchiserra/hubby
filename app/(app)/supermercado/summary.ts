import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";

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
  const { grocery } = await getPanelCounters();

  return buildGrocerySummary({
    missingNames: grocery.missing_names,
    missingCount: grocery.missing_count,
    total: grocery.total,
  });
}
