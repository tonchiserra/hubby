import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PanelCounters } from "@/lib/supabase/types";

/**
 * Los contadores de supermercado, libros y deseos en una sola llamada.
 *
 * `cache()` de React memoiza por request: los tres resúmenes piden lo mismo y
 * tiene que viajar una sola vez. Sin esto volveríamos a tener tres consultas,
 * solo que ahora las tres serían la más cara.
 *
 * Si esto falla, las tres tarjetas se degradan juntas en vez de una sola. Es un
 * cambio consciente respecto de cuando cada módulo consultaba por su cuenta: lo
 * que `resumenAislado()` protege es que la home siga renderizando y se pueda
 * navegar, y eso se mantiene.
 */
export const getPanelCounters = cache(async (): Promise<PanelCounters> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("panel_resumen");

  if (error) {
    throw new Error(
      `No se pudieron leer los contadores del panel: ${error.message}`,
    );
  }

  return data;
});
