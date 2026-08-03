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
        transitionName={moduleTitleTransition("tareas")}
        title="Tareas"
        subtitle="Cargando…"
      />
      {[0, 1].map((grupo) => (
        <div key={grupo} className="flex flex-col">
          <div className="bg-sand mb-2 ml-1 h-3 w-28 animate-pulse rounded" />
          <div className="bg-card shadow-card flex flex-col overflow-hidden rounded-lg">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="bg-sand size-[22px] shrink-0 animate-pulse rounded-full" />
                <div className="bg-sand h-4 flex-1 animate-pulse rounded" />
              </div>
            ))}
          </div>
          <div className="bg-sand mt-2 ml-1 h-3 w-44 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
