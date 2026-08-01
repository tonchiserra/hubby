import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/supabase/types";

/**
 * La biblioteca entera. RLS ya filtra por dueño, así que no se repite acá.
 * Se trae completa -es una biblioteca personal, no un catálogo- para que el
 * buscador y los filtros respondan en el cliente sin ida y vuelta.
 */
export async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("title", { ascending: true });

  if (error) throw new Error(`No se pudo leer la biblioteca: ${error.message}`);
  return data ?? [];
}
