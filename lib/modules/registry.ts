import {
  BasketIcon,
  BookOpenIcon,
  HeartIcon,
  ListChecksIcon,
} from "@phosphor-icons/react/dist/ssr";
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
  },
  {
    id: "book",
    slug: "libros",
    label: "Libros",
    icon: BookOpenIcon,
    description: "Lo que leíste, lo que estás leyendo y lo que querés leer.",
  },
  {
    id: "wish",
    slug: "deseos",
    label: "Deseos",
    // Corazón y no bolsa: el ícono tiene que decir "lo quiero", no "lo estoy
    // comprando". Una bolsa además se confunde con la canasta del supermercado
    // en los 20px del chip.
    icon: HeartIcon,
    description: "Las cosas que te querés comprar, con su precio y dónde.",
  },
  {
    id: "task_list",
    slug: "tareas",
    label: "Tareas",
    icon: ListChecksIcon,
    description:
      "Listas que se repiten. Cada una vuelve a pendiente el día que le toca.",
  },
];

export const findModuleBySlug = (slug: string) =>
  MODULES.find((m) => m.slug === slug);
