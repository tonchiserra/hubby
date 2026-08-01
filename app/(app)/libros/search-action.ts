"use server";

import { searchBooks, type BookResult } from "./open-library";

/**
 * Búsqueda en Open Library expuesta como Server Action.
 *
 * Va por el servidor y no por fetch directo desde el navegador para que la
 * respuesta se cachee -next: revalidate- entre navegaciones y usuarios, y para
 * no depender de que Open Library mande cabeceras CORS.
 */
export async function searchOpenLibrary(query: string): Promise<BookResult[]> {
  return searchBooks(query);
}
