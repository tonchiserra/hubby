import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";
import type { ModuleDefinition } from "./types";

/**
 * Única fuente de verdad de los módulos. La navegación se deriva de este array.
 *
 * Client-safe por diseño: solo metadata, sin imports de servidor. El widget de
 * dashboard de cada módulo se registra aparte, en `widgets.tsx`.
 */
export const MODULES: ModuleDefinition[] = [
  {
    id: "grocery_item",
    slug: "super",
    label: "Lista del súper",
    shortLabel: "Súper",
    icon: ShoppingCartIcon,
    description: "Lo que falta comprar, siempre a mano.",
  },
];

export const findModuleBySlug = (slug: string) =>
  MODULES.find((m) => m.slug === slug);
