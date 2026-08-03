import type { ModuleSummary } from "./summary";

/**
 * Lo que muestra la tarjeta de un módulo cuyo resumen no se pudo leer.
 *
 * Urgencia 0 a propósito: un módulo que no se pudo leer no sabe si reclama
 * algo, y adivinar que sí lo mandaría arriba de todo en el panel.
 */
export const RESUMEN_CAIDO: ModuleSummary = {
  urgency: 0,
  detail: "No se pudo cargar",
  preview: [],
};

/**
 * Aísla la falla de un módulo para que no se lleve puesto al panel.
 *
 * El panel junta los resúmenes de todos los módulos con `Promise.all`, y
 * `Promise.all` rechaza entero apenas una sola promesa rechaza. Sin este
 * aislamiento, un módulo roto no rompe su tarjeta: rompe la home, que además
 * es la única forma de navegar desde que se sacaron la toolbar y la sidebar.
 *
 * Fue exactamente lo que pasó al mergear el módulo de deseos sin correr su
 * migración: la tabla no existía, su resumen tiraba excepción y la app entera
 * quedaba inalcanzable aunque supermercado, libros y ajustes andaban bien.
 *
 * La falla se degrada pero no se traga: queda en el log del servidor, porque
 * un módulo que falla en silencio es un módulo que nadie arregla.
 */
export async function resumenAislado(
  id: string,
  leer: () => Promise<ModuleSummary>,
): Promise<ModuleSummary> {
  try {
    return await leer();
  } catch (error) {
    console.error(`[panel] no se pudo leer el resumen de "${id}"`, error);
    return RESUMEN_CAIDO;
  }
}
