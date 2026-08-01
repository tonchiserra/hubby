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
        transitionName={moduleTitleTransition("libros")}
        title="Libros"
        subtitle="Cargando…"
      />
      <div className="bg-sand h-touch animate-pulse rounded-lg" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card shadow-card flex gap-3.5 rounded-lg p-3">
            <div className="bg-sand h-24 w-16 shrink-0 animate-pulse rounded-md" />
            <div className="flex flex-1 flex-col gap-2 py-1">
              <div className="bg-sand h-4 w-3/4 animate-pulse rounded" />
              <div className="bg-sand h-3 w-1/2 animate-pulse rounded" />
              <div className="bg-sand mt-auto h-5 w-24 animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
