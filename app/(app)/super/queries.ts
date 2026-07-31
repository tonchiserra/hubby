import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GroceryItem } from "@/lib/supabase/types";

/**
 * No hace falta filtrar por user_id: la política RLS ya lo hace en la base.
 * Filtrarlo también acá daría una falsa sensación de que la seguridad vive en
 * la aplicación, cuando en realidad vive en el motor.
 */
export async function getGroceryItems(): Promise<GroceryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudo leer la lista: ${error.message}`);
  return data ?? [];
}

export async function getGrocerySummary() {
  const supabase = await createClient();
  const [pending, total] = await Promise.all([
    supabase
      .from("grocery_items")
      .select("*", { count: "exact", head: true })
      .eq("done", false),
    supabase.from("grocery_items").select("*", { count: "exact", head: true }),
  ]);

  return {
    pending: pending.count ?? 0,
    total: total.count ?? 0,
  };
}
