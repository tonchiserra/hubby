"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResetKind } from "@/lib/supabase/types";
import { hoyLocal } from "./reset";

const PATHS = ["/tareas", "/"] as const;
function revalidate() {
  PATHS.forEach((p) => revalidatePath(p));
}

export type ActionResult = { error?: string };

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const SCHEMA_MISMATCH = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);

type PgError = { code?: string; message?: string };

function describe(error: PgError, fallback: string): string {
  if (error.code && SCHEMA_MISMATCH.has(error.code)) {
    return "La base de datos no está actualizada: falta aplicar la última migración en Supabase.";
  }
  console.error("[tareas]", error.code, error.message);
  return fallback;
}

const MAX_NOMBRE = 80;
const MAX_TITULO = 200;

const limpiar = (raw: string) => raw.trim().replace(/\s+/g, " ");

export type ListDraft = {
  name: string;
  reset_kind: ResetKind;
  reset_day: number | null;
  reset_month: number | null;
};

/**
 * Espeja el check de la tabla. Se valida de los dos lados a propósito: la base
 * es la que garantiza que el dato no se rompa, pero un 23514 en pantalla no le
 * explica a nadie qué hizo mal.
 */
function validarLista(
  draft: ListDraft,
): { error: string } | { limpio: ListDraft } {
  const name = limpiar(draft.name);
  if (!name) return { error: "Poné un nombre para la lista." };
  if (name.length > MAX_NOMBRE) return { error: "El nombre es demasiado largo." };

  const { reset_kind, reset_day, reset_month } = draft;

  const enRango = (n: number | null, min: number, max: number) =>
    n !== null && Number.isInteger(n) && n >= min && n <= max;

  switch (reset_kind) {
    case "nunca":
      return { limpio: { name, reset_kind, reset_day: null, reset_month: null } };

    case "semanal":
      if (!enRango(reset_day, 0, 6)) return { error: "Elegí el día de la semana." };
      return { limpio: { name, reset_kind, reset_day, reset_month: null } };

    case "mensual":
      if (!enRango(reset_day, 1, 31)) return { error: "Elegí el día del mes." };
      return { limpio: { name, reset_kind, reset_day, reset_month: null } };

    case "anual":
      if (!enRango(reset_day, 1, 31)) return { error: "Elegí el día." };
      if (!enRango(reset_month, 1, 12)) return { error: "Elegí el mes." };
      return { limpio: { name, reset_kind, reset_day, reset_month } };

    default:
      return { error: "Esa frecuencia de reinicio no existe." };
  }
}

const mismaRegla = (a: ListDraft, b: ListDraft) =>
  a.reset_kind === b.reset_kind &&
  a.reset_day === b.reset_day &&
  a.reset_month === b.reset_month;

export async function addList(draft: ListDraft): Promise<ActionResult> {
  const v = validarLista(draft);
  if ("error" in v) return v;

  const supabase = await createClient();
  const { error } = await supabase.from("task_lists").insert({
    ...v.limpio,
    // Explícito y en fecha local: el default de la tabla es la fecha del
    // servidor, que a la noche ya está en el día siguiente. Una lista creada
    // hoy no se puede reiniciar hoy.
    last_reset_on: hoyLocal(new Date()),
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Ya tenés una lista llamada “${v.limpio.name}”.` };
    }
    if (error.code === CHECK_VIOLATION) {
      return { error: "Esa combinación de reinicio no es válida." };
    }
    return { error: describe(error, "No se pudo crear la lista.") };
  }

  revalidate();
  return {};
}

export async function updateList(
  id: string,
  draft: ListDraft,
): Promise<ActionResult> {
  const v = validarLista(draft);
  if ("error" in v) return v;

  const supabase = await createClient();

  const { data: actual, error: leer } = await supabase
    .from("task_lists")
    .select("reset_kind, reset_day, reset_month")
    .eq("id", id)
    .single();

  if (leer) return { error: describe(leer, "No se pudo guardar la lista.") };

  // Cambiar la regla arranca el ciclo de cero. Sin esto, pasar una lista a
  // "todos los lunes" un viernes la reiniciaría al instante -el lunes ya pasó-
  // y las tildes desaparecerían apenas se guarda, sin que nadie lo pida.
  const reglaNueva = !mismaRegla(actual as ListDraft, v.limpio);

  const { error } = await supabase
    .from("task_lists")
    .update({
      ...v.limpio,
      ...(reglaNueva ? { last_reset_on: hoyLocal(new Date()) } : {}),
    })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Ya tenés una lista llamada “${v.limpio.name}”.` };
    }
    if (error.code === CHECK_VIOLATION) {
      return { error: "Esa combinación de reinicio no es válida." };
    }
    return { error: describe(error, "No se pudo guardar la lista.") };
  }

  revalidate();
  return {};
}

/** Las tareas se van con la lista: el borrado en cascada lo hace la base. */
export async function deleteList(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("task_lists").delete().eq("id", id);
  if (error) return { error: describe(error, "No se pudo borrar la lista.") };
  revalidate();
  return {};
}

export async function addTask(
  listId: string,
  title: string,
): Promise<ActionResult> {
  const limpio = limpiar(title);
  if (!limpio) return { error: "Escribí qué hay que hacer." };
  if (limpio.length > MAX_TITULO) return { error: "La tarea es demasiado larga." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .insert({ list_id: listId, title: limpio });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `“${limpio}” ya está en esa lista.` };
    }
    return { error: describe(error, "No se pudo agregar la tarea.") };
  }

  revalidate();
  return {};
}

export async function renameTask(
  id: string,
  title: string,
): Promise<ActionResult> {
  const limpio = limpiar(title);
  if (!limpio) return { error: "La tarea necesita un nombre." };
  if (limpio.length > MAX_TITULO) return { error: "La tarea es demasiado larga." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ title: limpio })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `“${limpio}” ya está en esa lista.` };
    }
    return { error: describe(error, "No se pudo renombrar la tarea.") };
  }

  revalidate();
  return {};
}

export async function setTaskDone(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  if (error) return { error: describe(error, "No se pudo marcar la tarea.") };
  revalidate();
  return {};
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: describe(error, "No se pudo borrar la tarea.") };
  revalidate();
  return {};
}
