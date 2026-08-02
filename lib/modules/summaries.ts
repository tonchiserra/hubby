import "server-only";
import { getGrocerySummary } from "@/app/(app)/supermercado/summary";
import { getBooksSummary } from "@/app/(app)/libros/summary";
import { getWishesSummary } from "@/app/(app)/deseos/summary";
import type { ModuleSummary } from "./summary";

/**
 * Resúmenes de cada módulo, indexados por `id`.
 *
 * Separado del registry a propósito: acá se importan funciones que consultan
 * la base, y `registry.ts` lo consume código de cliente. Mezclarlos arrastra
 * next/headers al bundle del navegador y el build falla — ya pasó una vez.
 *
 * Solo lo importa el panel, que es Server Component.
 */
export const MODULE_SUMMARIES: Record<string, () => Promise<ModuleSummary>> = {
  grocery_item: getGrocerySummary,
  book: getBooksSummary,
  wish: getWishesSummary,
};
