import type { ModuleDefinition } from "./types";

/**
 * Lo que cada módulo le aporta al panel. Es deliberadamente chico: el panel
 * espera todos los resúmenes antes de pintar, así que cada uno tiene que salir
 * de una consulta barata.
 */
export type ModuleSummary = {
  /**
   * Cuánto reclama atención el módulo. 0 = nada que hacer, y entonces se
   * colapsa a una línea callada. Números más altos suben en el panel.
   */
  urgency: number;
  /** Línea de estado bajo el nombre del módulo. */
  detail: string;
  /** Hasta tres ítems concretos. Vacío si al módulo no le aplica. */
  preview: string[];
};

export type ModulePanelEntry = {
  module: ModuleDefinition;
  summary: ModuleSummary;
};

/**
 * Parte los módulos en los que reclaman atención y los que no.
 *
 * El desempate por etiqueta importa: sin él, dos módulos con la misma urgencia
 * quedarían en el orden que devuelva Promise.all, que puede variar entre
 * cargas y haría bailar el panel sin motivo.
 */
export function partitionByUrgency(entries: ModulePanelEntry[]): {
  active: ModulePanelEntry[];
  quiet: ModulePanelEntry[];
} {
  const byLabel = (a: ModulePanelEntry, b: ModulePanelEntry) =>
    a.module.label.localeCompare(b.module.label, "es");

  // Se copia antes de ordenar: sort muta, y el llamador no espera eso.
  const active = entries
    .filter((e) => e.summary.urgency > 0)
    .sort((a, b) => b.summary.urgency - a.summary.urgency || byLabel(a, b));

  const quiet = entries.filter((e) => e.summary.urgency === 0).sort(byLabel);

  return { active, quiet };
}
