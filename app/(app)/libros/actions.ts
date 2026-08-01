"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookFormat, BookStatus } from "@/lib/supabase/types";

const PATHS = ["/libros", "/"] as const;
function revalidate() {
  PATHS.forEach((p) => revalidatePath(p));
}

export type ActionResult = { error?: string };

const UNIQUE_VIOLATION = "23505";
const SCHEMA_MISMATCH = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);

type PgError = { code?: string; message?: string };

function describe(error: PgError, fallback: string): string {
  if (error.code && SCHEMA_MISMATCH.has(error.code)) {
    return "La base de datos no está actualizada: falta aplicar la última migración en Supabase.";
  }
  console.error("[libros]", error.code, error.message);
  return fallback;
}

/** Un libro nace en "quiero leer": se anota cuando te lo recomiendan. */
export async function addBook(input: {
  title: string;
  author?: string | null;
  year?: number | null;
  coverUrl?: string | null;
  olid?: string | null;
}): Promise<ActionResult> {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title) return { error: "Escribí el título." };
  if (title.length > 300) return { error: "El título es demasiado largo." };

  const supabase = await createClient();

  // Los libros nuevos van arriba: acabás de anotarlo, es lo que querés ver.
  const { data: primero } = await supabase
    .from("books")
    .select("position")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("books").insert({
    position: (primero?.position ?? 1) - 1,
    title,
    author: input.author?.trim() || null,
    year: input.year ?? null,
    cover_url: input.coverUrl ?? null,
    olid: input.olid ?? null,
    status: "quiero",
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `“${title}” ya está en tu biblioteca.` };
    }
    return { error: describe(error, "No se pudo agregar el libro.") };
  }

  revalidate();
  return {};
}






/**
 * Guarda todos los campos editables de una. El editor es un formulario: mandar
 * una request por campo dejaría el libro en estados intermedios si alguna falla.
 */
export async function updateBook(
  id: string,
  input: {
    title: string;
    status: BookStatus;
    format: BookFormat;
    rating: number | null;
    readYear: number | null;
  },
): Promise<ActionResult> {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title) return { error: "El título no puede quedar vacío." };
  if (title.length > 300) return { error: "El título es demasiado largo." };

  const { rating } = input;
  if (rating !== null && (rating < 0 || rating > 5 || (rating * 2) % 1 !== 0)) {
    return { error: "La valoración tiene que ir de 0 a 5, de a medios puntos." };
  }

  const actual = new Date().getFullYear();
  // El año es independiente del estado: se guarda tal cual venga. Antes se
  // limpiaba al salir de "leído", lo que borraba en silencio un dato que el
  // usuario habia cargado a proposito.
  const readYear = input.readYear;
  if (readYear !== null && (readYear < 1900 || readYear > actual + 1)) {
    return { error: `El año tiene que estar entre 1900 y ${actual + 1}.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({
      title,
      status: input.status,
      format: input.format,
      rating,
      read_year: readYear,
    })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Ya tenés un libro llamado “${title}”.` };
    }
    return { error: describe(error, "No se pudo guardar el libro.") };
  }

  revalidate();
  return {};
}

/**
 * Guarda el orden nuevo completo. Va por una función de Postgres para que sea
 * atómico y una sola ida y vuelta, en vez de una request por libro.
 */
export async function reorderBooks(ids: string[]): Promise<ActionResult> {
  if (ids.length === 0) return {};

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_books", { ids });

  if (error) return { error: describe(error, "No se pudo guardar el orden.") };
  revalidate();
  return {};
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { error: describe(error, "No se pudo borrar el libro.") };
  revalidate();
  return {};
}
