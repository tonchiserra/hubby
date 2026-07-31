import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import type { ModuleDefinition } from "./types";

/**
 * Única fuente de verdad de los módulos. La navegación se deriva de este array.
 *
 * Client-safe por diseño: solo metadata, sin imports de servidor. El resumen
 * que cada módulo aporta al panel se registra aparte, en `summaries.ts`.
 */
export const MODULES: ModuleDefinition[] = [
  {
    id: "grocery_item",
    slug: "supermercado",
    label: "Supermercado",
    shortLabel: "Súper",
    icon: BasketIcon,
    description: "Tu inventario de casa. Lo que se termina arma la lista de compras.",
    // Verde salvia: el color de marca de hubby vive acá, en su primer módulo.
    accent: {
      solid: "#4a7a5b",
      ink: "#ffffff",
      wash: "#e0ebe3",
      solidDark: "#7cb28c",
      washDark: "#22301f",
    },
  },
];

export const findModuleBySlug = (slug: string) =>
  MODULES.find((m) => m.slug === slug);
