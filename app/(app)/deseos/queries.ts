import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Wish } from "@/lib/supabase/types";

/**
 * La lista entera. RLS ya filtra por dueño, así que no se repite acá.
 * Se trae completa -es una lista personal, no un catálogo- para que el
 * buscador, los filtros y el total respondan en el cliente sin ida y vuelta.
 *
 * El orden por estado no se pide acá: PostgREST ordena por columna y 'proximo'
 * tendría que ir antes que 'quiero', que no es su orden alfabético. Se resuelve
 * en la lista, que además ya tiene todos los datos.
 */
export async function getWishes(): Promise<Wish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishes")
    .select("*")
    // Lo último que anotaste arriba: es lo que tenés fresco en la cabeza.
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudo leer la lista de deseos: ${error.message}`);
  return data ?? [];
}
