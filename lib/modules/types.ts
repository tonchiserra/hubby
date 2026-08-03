import type { Icon } from "@phosphor-icons/react";

/**
 * Metadata de un módulo. A propósito NO incluye su resumen de panel: este
 * archivo lo consume la navegación, que corre en cliente, y arrastrar ahí una
 * consulta mete next/headers en el bundle del navegador.
 *
 * Los resúmenes viven en `summaries.ts`, que es solo de servidor.
 */
export type ModuleDefinition = {
  /** Identificador estable. Coincide con el nombre de su tabla, en singular. */
  id: string;
  /** Segmento de ruta. `super` → /super */
  slug: string;
  label: string;
  /** Versión corta para la tab bar, donde el espacio es escaso. */
  shortLabel?: string;
  icon: Icon;
  description: string;
};


export const modulePath = (m: ModuleDefinition) => `/${m.slug}`;
