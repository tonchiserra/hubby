import "server-only";
import type { ModuleSummary } from "@/lib/modules/summary";
import { getLists } from "./queries";

/** Cuántas tareas concretas muestra el panel antes de cortar. */
const PREVIEW_SIZE = 3;

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

/**
 * Parte pura: dado lo que quedó pendiente, arma el resumen. Separada de la
 * consulta para poder probar las reglas sin base de datos.
 */
export function buildTasksSummary({
  pendientes,
  listas,
}: {
  /** Títulos de todo lo pendiente, en el orden en que se muestran. */
  pendientes: string[];
  listas: number;
}): ModuleSummary {
  if (listas === 0) {
    return { urgency: 0, detail: "Sin listas todavía", preview: [] };
  }

  if (pendientes.length === 0) {
    return {
      urgency: 0,
      detail: `Todo hecho · ${plural(listas, "lista", "listas")}`,
      preview: [],
    };
  }

  // Acá sí pesa todo lo pendiente, a diferencia de deseos o libros: una tarea
  // anotada es algo que decidiste hacer, no una aspiración. Y si la lista se
  // reinicia sola, lo pendiente vuelve a aparecer justo cuando corresponde.
  return {
    urgency: pendientes.length,
    detail: plural(pendientes.length, "pendiente", "pendientes"),
    preview: pendientes.slice(0, PREVIEW_SIZE),
  };
}

export async function getTasksSummary(): Promise<ModuleSummary> {
  // Se reusa la lectura de la pantalla en vez de contar con `head: true`: es la
  // que aplica los reinicios vencidos. Contando aparte, el panel diría "todo
  // hecho" el 1 a la mañana, hasta que alguien entrara al módulo.
  const listas = await getLists();

  return buildTasksSummary({
    pendientes: listas.flatMap((l) =>
      l.tasks.filter((t) => !t.done).map((t) => t.title),
    ),
    listas: listas.length,
  });
}
