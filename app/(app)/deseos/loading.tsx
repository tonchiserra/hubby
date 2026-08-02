import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";

/**
 * Esqueleto. Hace que la ruta commitee al instante, que es lo que permite que
 * la view transition anime enseguida en vez de esperar la consulta.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("deseos")}
        title="Deseos"
        subtitle="Cargando…"
      />
      <div className="bg-sand h-touch animate-pulse rounded-lg" />
      <div className="bg-card shadow-card flex flex-col overflow-hidden rounded-lg">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="bg-sand h-4 w-2/3 animate-pulse rounded" />
              <div className="bg-sand h-5 w-20 animate-pulse rounded-full" />
            </div>
            <div className="bg-sand h-4 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
