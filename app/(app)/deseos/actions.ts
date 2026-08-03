"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WishStatus } from "@/lib/supabase/types";

const PATHS = ["/deseos", "/"] as const;
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
  console.error("[deseos]", error.code, error.message);
  return fallback;
}

const MAX_TITULO = 200;
/** Diez dígitos enteros: lo que admite numeric(12,2) en la tabla. */
const MAX_PRECIO = 9_999_999_999.99;

function limpiarTitulo(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Validación compartida por alta y edición. Devuelve el error o los valores ya
 * normalizados, para que las dos rutas no puedan divergir.
 */
function validar(input: {
  title: string;
  price?: number | null;
  url?: string | null;
}): { error: string } | { title: string; price: number | null; url: string | null } {
  const title = limpiarTitulo(input.title);
  if (!title) return { error: "Escribí qué querés." };
  if (title.length > MAX_TITULO) return { error: "El nombre es demasiado largo." };

  const price = input.price ?? null;
  if (price !== null) {
    if (!Number.isFinite(price) || price < 0) {
      return { error: "El precio no puede ser negativo." };
    }
    if (price > MAX_PRECIO) return { error: "El precio es demasiado alto." };
  }

  // Solo http(s): una URL con otro esquema no va a abrir desde el navegador y
  // puede ser un vector raro. Vacío significa "sin link", no "dejalo como
  // estaba".
  const url = input.url?.trim() || null;
  if (url && !/^https?:\/\//i.test(url)) {
    return { error: "El link tiene que empezar con http." };
  }
  if (url && url.length > 2000) return { error: "El link es demasiado largo." };

  // El precio se redondea a centavos acá y no en la base: Postgres lo haría en
  // silencio al guardar, y entonces lo que se ve tras recargar no sería lo que
  // se escribió.
  return { title, price: price === null ? null : Math.round(price * 100) / 100, url };
}

/** Un deseo nace en "quiero": lo anotás cuando se te ocurre, no cuando lo comprás. */
export async function addWish(input: {
  title: string;
  price?: number | null;
  url?: string | null;
}): Promise<ActionResult> {
  const v = validar(input);
  if ("error" in v) return v;

  const supabase = await createClient();
  const { error } = await supabase.from("wishes").insert({
    title: v.title,
    price: v.price,
    url: v.url,
    status: "quiero",
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `“${v.title}” ya está en tu lista.` };
    }
    return { error: describe(error, "No se pudo agregar el deseo.") };
  }

  revalidate();
  return {};
}

/**
 * Guarda todos los campos editables de una. El editor es un formulario: mandar
 * una request por campo dejaría el deseo en estados intermedios si alguna falla.
 */
export async function updateWish(
  id: string,
  input: {
    title: string;
    price: number | null;
    url: string | null;
    status: WishStatus;
  },
): Promise<ActionResult> {
  const v = validar(input);
  if ("error" in v) return v;

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .update({ title: v.title, price: v.price, url: v.url, status: input.status })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Ya tenés un deseo llamado “${v.title}”.` };
    }
    return { error: describe(error, "No se pudo guardar el deseo.") };
  }

  revalidate();
  return {};
}

export async function deleteWish(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("wishes").delete().eq("id", id);
  if (error) return { error: describe(error, "No se pudo borrar el deseo.") };
  revalidate();
  return {};
}
