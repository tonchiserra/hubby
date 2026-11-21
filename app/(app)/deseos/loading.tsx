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
      <div className="h-touch skeleton rounded-full" />
      <div className="bg-card border-line border flex flex-col overflow-hidden rounded-lg">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-4 w-2/3 skeleton rounded" />
              <div className="h-5 w-20 skeleton rounded-full" />
            </div>
            <div className="h-4 w-16 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
