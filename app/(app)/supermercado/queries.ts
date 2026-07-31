import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem } from "@/lib/supabase/types";

/**
 * El inventario completo. No hace falta filtrar por user_id: la política RLS ya
 * lo hace en la base, y repetirlo acá daría la falsa impresión de que la
 * seguridad vive en la aplicación.
 *
 * Se trae entero -es el inventario de una casa, no un catálogo enorme- para que
 * el buscador filtre en el cliente y responda al instante, sin ida y vuelta.
 */
export async function getItems(): Promise<GroceryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudo leer el inventario: ${error.message}`);
  return data ?? [];
}
