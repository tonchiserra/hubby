import { BasketIcon, BookOpenIcon } from "@phosphor-icons/react/dist/ssr";
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
  {
    id: "book",
    slug: "libros",
    label: "Libros",
    icon: BookOpenIcon,
    description: "Lo que leíste, lo que estás leyendo y lo que querés leer.",
    // Azul pizarra: bien distinto del salvia del supermercado, y sin acercarse
    // al terracota, que está reservado para lo destructivo.
    accent: {
      solid: "#4a6285",
      ink: "#ffffff",
      wash: "#e4e9f0",
      solidDark: "#8fa8c9",
      washDark: "#1e2733",
    },
  },
];

export const findModuleBySlug = (slug: string) =>
  MODULES.find((m) => m.slug === slug);
