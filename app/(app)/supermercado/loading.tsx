import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";

/**
 * Esqueleto de la pantalla mientras llegan los datos.
 *
 * No es solo cosmético: hace que la ruta commitee al instante en vez de esperar
 * la consulta a Supabase. Eso importa para la view transition, que mantiene la
 * pantalla congelada hasta que existe el DOM de destino — sin esto la animación
 * se quedaba esperando más de un segundo y medio.
 *
 * El título lleva el mismo `viewTransitionName` que la tarjeta del panel, así
 * el elemento compartido tiene contra qué animar desde el primer frame.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("supermercado")}
        title="Supermercado"
        subtitle="Cargando…"
      />

      <div className="bg-sand h-touch animate-pulse rounded-lg" />
      <div className="bg-sand h-9 animate-pulse rounded-lg" />

      <div className="bg-card shadow-card flex flex-col gap-4 rounded-lg p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-sand size-[22px] shrink-0 animate-pulse rounded-full" />
            <div
              className="bg-sand h-4 animate-pulse rounded"
              style={{ width: `${60 - i * 12}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
