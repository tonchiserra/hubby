import { PageHeader } from "@/components/hubby/page-header";
import { findModuleBySlug } from "@/lib/modules/registry";
import { accentVars } from "@/lib/modules/types";
import { moduleTitleTransition } from "@/lib/transition-names";

/**
 * Esqueleto. Hace que la ruta commitee al instante, que es lo que permite que
 * la view transition anime enseguida en vez de esperar la consulta.
 */
export default function Loading() {
  const modulo = findModuleBySlug("libros")!;

  return (
    <div className="flex flex-col gap-6" style={accentVars(modulo)}>
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("libros")}
        title="Libros"
        subtitle="Cargando…"
      />
      <div className="bg-sand h-touch animate-pulse rounded-lg" />
      <div className="bg-sand h-9 animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-card shadow-card flex flex-col gap-2 rounded-lg p-3">
            <div className="bg-sand aspect-[2/3] animate-pulse rounded-md" />
            <div className="bg-sand h-3 w-4/5 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
