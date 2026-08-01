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
  const { error } = await supabase.from("books").insert({
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
 * Cambia el estado. Al pasar a "leído" se sella el año en curso si no había
 * uno; al salir de "leído" se limpia, para que no quede un año colgado de un
 * libro que ya no terminaste.
 */
export async function setStatus(
  id: string,
  status: BookStatus,
): Promise<ActionResult> {
  const supabase = await createClient();

  const patch: { status: BookStatus; read_year?: number | null } = { status };
  if (status === "leido") {
    const { data } = await supabase
      .from("books")
      .select("read_year")
      .eq("id", id)
      .single();
    if (!data?.read_year) patch.read_year = new Date().getFullYear();
  } else {
    patch.read_year = null;
  }

  const { error } = await supabase.from("books").update(patch).eq("id", id);
  if (error) return { error: describe(error, "No se pudo cambiar el estado.") };
  revalidate();
  return {};
}

/** De 0 a 5 en pasos de 0.5. null limpia la valoración. */
export async function setRating(
  id: string,
  rating: number | null,
): Promise<ActionResult> {
  if (rating !== null && (rating < 0 || rating > 5 || (rating * 2) % 1 !== 0)) {
    return { error: "La valoración tiene que ir de 0 a 5, de a medios puntos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("books").update({ rating }).eq("id", id);
  if (error) return { error: describe(error, "No se pudo guardar la valoración.") };
  revalidate();
  return {};
}

export async function setFormat(
  id: string,
  format: BookFormat,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("books").update({ format }).eq("id", id);
  if (error) return { error: describe(error, "No se pudo cambiar el formato.") };
  revalidate();
  return {};
}

export async function setReadYear(
  id: string,
  year: number | null,
): Promise<ActionResult> {
  const actual = new Date().getFullYear();
  if (year !== null && (year < 1900 || year > actual + 1)) {
    return { error: `El año tiene que estar entre 1900 y ${actual + 1}.` };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ read_year: year })
    .eq("id", id);
  if (error) return { error: describe(error, "No se pudo guardar el año.") };
  revalidate();
  return {};
}

/** Cambia el título, respetando la unicidad de la biblioteca. */
export async function renameBook(
  id: string,
  title: string,
): Promise<ActionResult> {
  const limpio = title.trim().replace(/\s+/g, " ");
  if (!limpio) return { error: "El título no puede quedar vacío." };
  if (limpio.length > 300) return { error: "El título es demasiado largo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ title: limpio })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Ya tenés un libro llamado “${limpio}”.` };
    }
    return { error: describe(error, "No se pudo renombrar el libro.") };
  }

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
