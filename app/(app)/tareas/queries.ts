import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database, Task, TaskList } from "@/lib/supabase/types";
import { hoyLocal, reinicioPendiente } from "./reset";

export type ListWithTasks = TaskList & { tasks: Task[] };

/**
 * Las listas con sus tareas, ya reiniciadas si correspondía.
 *
 * El reinicio se aplica al leer y no desde un proceso programado. No es una
 * simplificación: un cron en la capa gratuita es justo lo que no se puede
 * sostener -los proyectos de Supabase se pausan tras una semana sin actividad-
 * y una app personal puede pasar días sin abrirse. Al calcularlo en la lectura,
 * lo que ves siempre está al día, aunque hayan pasado tres meses.
 */
export async function getLists(): Promise<ListWithTasks[]> {
  const supabase = await createClient();

  // Un solo viaje: PostgREST trae las tareas embebidas por la foreign key.
  const { data, error } = await supabase
    .from("task_lists")
    .select("*, tasks(*)")
    .order("created_at", { ascending: true })
    .order("created_at", { ascending: true, referencedTable: "tasks" });

  if (error) throw new Error(`No se pudieron leer las listas: ${error.message}`);

  return aplicarReinicios(supabase, (data ?? []) as ListWithTasks[]);
}

/**
 * Destilda las listas cuyo reinicio ya venció y devuelve el resultado ya
 * aplicado en memoria, para no volver a consultar lo que se acaba de escribir.
 *
 * El orden de las dos escrituras importa y es el único cuidado que hay que
 * tener: primero se destildan las tareas y recién después se mueve la marca. Si
 * se cortara en el medio, la lista queda pendiente de reiniciar y el próximo
 * acceso lo reintenta —es idempotente. Al revés se perdería el reinicio hasta
 * la vuelta siguiente, que en una lista anual es un año.
 *
 * Una falla acá no rompe la pantalla: se registra y se devuelve lo leído. Ver
 * tildes viejas es molesto; no poder abrir las tareas, mucho peor.
 */
async function aplicarReinicios(
  supabase: SupabaseClient<Database>,
  listas: ListWithTasks[],
): Promise<ListWithTasks[]> {
  const hoy = hoyLocal(new Date());

  const vencidas = listas
    .map((lista) => ({ lista, marca: reinicioPendiente(lista, hoy) }))
    .filter((v): v is { lista: ListWithTasks; marca: string } => v.marca !== null);

  if (vencidas.length === 0) return listas;

  const ids = vencidas.map((v) => v.lista.id);

  const { error } = await supabase
    .from("tasks")
    .update({ done: false })
    .in("list_id", ids)
    .eq("done", true);

  if (error) {
    console.error("[tareas] no se pudieron destildar las listas vencidas", error);
    return listas;
  }

  // Cada lista guarda la fecha que le tocaba, no la de hoy: una lista mensual
  // que se reinicia el 5 pero se abre el 20 tiene que quedar marcada el 5, o el
  // mes que viene el cálculo arranca corrido.
  const marcadas = await Promise.all(
    vencidas.map(({ lista, marca }) =>
      supabase
        .from("task_lists")
        .update({ last_reset_on: marca })
        .eq("id", lista.id),
    ),
  );

  const falla = marcadas.find((r) => r.error);
  if (falla?.error) {
    console.error("[tareas] no se pudo marcar el reinicio", falla.error);
  }

  const porId = new Map(vencidas.map((v) => [v.lista.id, v.marca]));

  return listas.map((lista) => {
    const marca = porId.get(lista.id);
    if (!marca) return lista;
    return {
      ...lista,
      last_reset_on: marca,
      tasks: lista.tasks.map((t) => (t.done ? { ...t, done: false } : t)),
    };
  });
}
