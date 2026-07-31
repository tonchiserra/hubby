import { Suspense } from "react";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/hubby/page-header";
import { ListGroup } from "@/components/hubby/list";
import { EmptyState } from "@/components/hubby/empty-state";
import { MODULES } from "@/lib/modules/registry";
import { MODULE_WIDGETS } from "@/lib/modules/widgets";

function WidgetSkeleton() {
  return (
    <div className="flex min-h-touch items-center gap-3 px-4 py-2.5">
      <div className="bg-fill-tertiary size-6 animate-pulse rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="bg-fill-tertiary h-4 w-32 animate-pulse rounded" />
        <div className="bg-fill-tertiary h-3 w-20 animate-pulse rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const withWidget = MODULES.filter((m) => MODULE_WIDGETS[m.id]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hoy" subtitle="Tu hub, de un vistazo" />

      {withWidget.length === 0 ? (
        <EmptyState
          icon={SquaresFourIcon}
          title="Todavía no hay módulos"
          description="Cuando registres uno, aparece acá automáticamente."
        />
      ) : (
        <ListGroup>
          {withWidget.map((m) => {
            const Widget = MODULE_WIDGETS[m.id];
            return (
              // Cada widget con su propio Suspense: uno lento no frena al resto.
              <Suspense key={m.id} fallback={<WidgetSkeleton />}>
                <Widget />
              </Suspense>
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
