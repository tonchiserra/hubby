import "server-only";
import type { ComponentType } from "react";
import { SupermercadoWidget } from "@/app/(app)/supermercado/widget";

/**
 * Widgets de dashboard, indexados por `id` de módulo.
 *
 * Separado del registry a propósito: acá se importan Server Components que
 * tocan la base, y el registry lo consume la navegación en cliente. Mezclarlos
 * arrastra next/headers al bundle del navegador y el build falla.
 *
 * Solo lo importa el dashboard, que es Server Component.
 */
export const MODULE_WIDGETS: Record<string, ComponentType> = {
  grocery_item: SupermercadoWidget,
};
