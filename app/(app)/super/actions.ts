"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PATHS = ["/super", "/"] as const;

/** El dashboard muestra el pendiente, así que también hay que revalidarlo. */
function revalidate() {
  PATHS.forEach((p) => revalidatePath(p));
}

export type ActionResult = { error?: string };

export async function addItem(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  // Se valida acá además del CHECK en la base: así el usuario recibe un mensaje
  // en castellano en lugar de un error de constraint de Postgres.
  if (!name) return { error: "Escribí qué querés agregar." };
  if (name.length > 120) return { error: "El nombre es demasiado largo." };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "La cantidad tiene que ser un número mayor a cero." };
  }

  const supabase = await createClient();
  // user_id lo completa `default auth.uid()` en la base.
  const { error } = await supabase
    .from("grocery_items")
    .insert({ name, quantity });

  if (error) return { error: "No se pudo agregar el ítem." };
  revalidate();
  return {};
}

export async function toggleItem(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .update({ done })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el ítem." };
  revalidate();
  return {};
}


export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("grocery_items").delete().eq("id", id);

  if (error) return { error: "No se pudo borrar el ítem." };
  revalidate();
  return {};
}

/** Limpia lo ya comprado. Es la acción de cierre después de ir al súper. */
export async function clearDone() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("grocery_items")
    .delete()
    .eq("done", true);

  if (error) return { error: "No se pudieron borrar los comprados." };
  revalidate();
  return {};
}
