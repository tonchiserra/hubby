import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";
import { formatPrice } from "./money";

export type WishPreview = { title: string; price: number | null };

/**
 * Parte pura: dado el reparto por estado, arma el resumen. Separada de la
 * consulta para poder probar las reglas sin base de datos.
 */
export function buildWishesSummary({
  proximos,
  proximosCount,
  pendientesCount,
  total,
}: {
  /** Los 'proximo' que entran en el preview. */
  proximos: WishPreview[];
  /** Todos los 'proximo', entren o no en el preview. */
  proximosCount: number;
  /** 'quiero' + 'proximo': lo que todavía no compraste. */
  pendientesCount: number;
  total: number;
}): ModuleSummary {
  if (total === 0) {
    return { urgency: 0, detail: "Sin deseos todavía", preview: [] };
  }

  /**
   * Una lista de deseos no es una lista de pendientes: querer veinte cosas no
   * es tener veinte cosas que hacer. Si la pila entera pesara, el módulo
   * estaría siempre arriba del panel y empujaría abajo a lo que sí reclama.
   *
   * Por eso lo único que pesa es lo que marcaste como próximo, que es una
   * decisión explícita de comprarlo.
   */
  if (proximosCount === 0) {
    return {
      urgency: 0,
      detail:
        pendientesCount === 0
          ? "Todo comprado"
          : `${pendientesCount} en la lista`,
      preview: [],
    };
  }

  return {
    // Es el total de próximos, no el largo del preview: con cinco decididos el
    // módulo tiene que pesar cinco aunque solo se muestren tres.
    urgency: proximosCount,
    detail: `${proximosCount} para comprar`,
    // El precio va pegado al nombre en vez de sumarse en un total: en el panel
    // lo útil es reconocer qué es cada cosa, y un total sin desglose no dice
    // qué resignar si no alcanza.
    preview: proximos.map((w) =>
      w.price === null ? w.title : `${w.title} · ${formatPrice(w.price)}`,
    ),
  };
}

export async function getWishesSummary(): Promise<ModuleSummary> {
  const { wishes } = await getPanelCounters();

  return buildWishesSummary({
    proximos: wishes.proximos,
    proximosCount: wishes.proximos_count,
    pendientesCount: wishes.pendientes_count,
    total: wishes.total,
  });
}
