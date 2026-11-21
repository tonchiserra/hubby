import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { cn } from "@/lib/utils";

/**
 * Esqueleto. Hace que la ruta commitee al instante, que es lo que permite que
 * la view transition anime enseguida en vez de esperar la consulta. Tiene la
 * silueta de la grilla: las columnas son las mismas que en library.tsx.
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
      <div className="flex flex-col gap-4">
        <div className="h-touch skeleton rounded-full" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-28 rounded-full" />
          <div className="skeleton h-10 w-20 rounded-full" />
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>
        <div className="skeleton mt-1 h-3 w-20 rounded" />
        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            // Dos filas completas con cualquier cantidad de columnas: lo de
            // abajo queda fuera de la pantalla igual.
            <div
              key={i}
              className={cn(
                "flex-col gap-3",
                i < 4 ? "flex" : i < 6 ? "hidden sm:flex" : "hidden md:flex",
              )}
            >
              <div className="skeleton aspect-[2/3] w-full rounded-md" />
              <div className="flex flex-col gap-1.5">
                <div className="skeleton h-4 w-4/5 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton mt-1 h-4 w-24 rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
