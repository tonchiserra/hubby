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
          <div className="mb-2 ml-1 h-3 w-28 skeleton rounded" />
          <div className="bg-card border-line border flex flex-col overflow-hidden rounded-lg">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="size-[22px] shrink-0 skeleton rounded-full" />
                <div className="h-4 flex-1 skeleton rounded" />
              </div>
            ))}
          </div>
          <div className="mt-2 ml-1 h-3 w-44 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}
