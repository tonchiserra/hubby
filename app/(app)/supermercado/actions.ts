"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PATHS = ["/supermercado", "/"] as const;

/** El dashboard muestra cuántos faltan, así que también hay que revalidarlo. */
function revalidate() {
  PATHS.forEach((p) => revalidatePath(p));
}

export type ActionResult = { error?: string };

/** Código de violación de restricción única en Postgres. */
const UNIQUE_VIOLATION = "23505";
/** Postgres: columna inexistente. PostgREST: columna ausente del schema cache. */
const SCHEMA_MISMATCH = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);

type PgError = { code?: string; message?: string };

/**
 * Traduce el error de Supabase a algo accionable.
 *
 * El caso importante es el desfasaje de esquema: si el código va por delante de
 * las migraciones, un mensaje genérico manda a debuggear la app cuando lo que
 * falta es correr el SQL. Vale la pena nombrarlo explícitamente.
 */
function describe(error: PgError, fallback: string): string {
  if (error.code && SCHEMA_MISMATCH.has(error.code)) {
    return "La base de datos no está actualizada: falta aplicar la última migración en Supabase.";
  }
  // El detalle real queda en los logs del servidor, no en pantalla.
  console.error("[supermercado]", error.code, error.message);
  return fallback;
}

/**
 * Agrega un producto al inventario. Nace inactivo -o sea, en la lista de
 * compras- porque uno lo anota justamente cuando se da cuenta de que le falta.
 */
export async function addItem(name: string): Promise<ActionResult> {
  const clean = name.trim().replace(/\s+/g, " ");

  // Se valida acá además del CHECK en la base para dar un mensaje en castellano
  // en vez de un error de constraint de Postgres.
  if (!clean) return { error: "Escribí el nombre del producto." };
  if (clean.length > 120) return { error: "El nombre es demasiado largo." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .insert({ name: clean, active: false });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `“${clean}” ya está en tu lista.` };
    }
    return { error: describe(error, "No se pudo agregar el producto.") };
  }

  revalidate();
  return {};
}

/** true = lo tengo en casa · false = se terminó, hay que comprarlo. */
export async function setActive(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .update({ active })
    .eq("id", id);

  if (error) return { error: describe(error, "No se pudo actualizar el producto.") };
  revalidate();
  return {};
}

/** Saca el producto del inventario del todo, no solo de la lista de compras. */
export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("grocery_items").delete().eq("id", id);

  if (error) return { error: describe(error, "No se pudo borrar el producto.") };
  revalidate();
  return {};
}

/** Después de ir al súper: todo lo que faltaba vuelve a estar en casa. */
export async function markAllBought() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .update({ active: true })
    .eq("active", false);

  if (error) return { error: describe(error, "No se pudo actualizar la lista.") };
  revalidate();
  return {};
}
