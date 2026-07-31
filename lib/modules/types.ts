import type { Icon } from "@phosphor-icons/react";

/**
 * Metadata de un módulo. A propósito NO incluye su widget de dashboard: este
 * archivo lo consume la navegación, que corre en cliente, y arrastrar ahí un
 * Server Component mete next/headers en el bundle del navegador.
 *
 * Los widgets viven en `widgets.tsx`, que es solo de servidor.
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
  /**
   * Color del módulo. Tiñe su pantalla entera y lo identifica en el panel.
   * Los tres valores son el sólido, el texto que va encima, y el lavado para
   * fondos suaves. Se inyectan como --accent, --accent-ink y --accent-wash.
   */
  accent: { solid: string; ink: string; wash: string; solidDark: string; washDark: string };
};

/** Variables CSS que hay que poner en el contenedor de la pantalla del módulo. */
export function accentVars(m: ModuleDefinition): React.CSSProperties {
  return {
    "--accent": m.accent.solid,
    "--accent-hover": m.accent.solid,
    "--accent-ink": m.accent.ink,
    "--accent-wash": m.accent.wash,
  } as React.CSSProperties;
}

export const modulePath = (m: ModuleDefinition) => `/${m.slug}`;
