import { Suspense } from "react";
import { GearIcon, SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/hubby/page-header";
import { ModuleCard } from "@/components/hubby/module-card";
import { EmptyState } from "@/components/hubby/empty-state";
import { MODULES } from "@/lib/modules/registry";
import { MODULE_WIDGETS } from "@/lib/modules/widgets";

function CardSkeleton() {
  return (
    <div className="bg-card flex flex-col gap-3 rounded-md p-4">
      <div className="bg-fill-tertiary size-6 animate-pulse rounded-full" />
      <div className="flex flex-col gap-1.5">
        <div className="bg-fill-tertiary h-4 w-28 animate-pulse rounded" />
        <div className="bg-fill-tertiary h-3 w-20 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const withWidget = MODULES.filter((m) => MODULE_WIDGETS[m.id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hubby" subtitle="Todo en un solo lugar" />

      {withWidget.length === 0 ? (
        <EmptyState
          icon={SquaresFourIcon}
          title="Todavía no hay módulos"
          description="Cuando registres uno, aparece acá automáticamente."
        />
      ) : (
        // Una columna en móvil, tres en escritorio.
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {withWidget.map((m) => {
            const Widget = MODULE_WIDGETS[m.id];
            return (
              // Cada widget con su propio Suspense: uno lento no frena al resto.
              <Suspense key={m.id} fallback={<CardSkeleton />}>
                <Widget />
              </Suspense>
            );
          })}

          {/* Ajustes va en la grilla como un módulo más. No está en el registry
              porque ese array modela módulos con datos propios -tabla, widget-
              y ajustes no es uno. */}
          <ModuleCard
            href="/ajustes"
            icon={GearIcon}
            label="Ajustes"
            detail="Cuenta y apariencia"
          />
        </div>
      )}
    </div>
  );
}
