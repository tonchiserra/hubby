import Link from "next/link";
import { GearIcon, SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/hubby/page-header";
import { ModuleCard } from "@/components/hubby/module-card";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { EmptyState } from "@/components/hubby/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { MODULES } from "@/lib/modules/registry";
import { MODULE_SUMMARIES } from "@/lib/modules/summaries";
import { partitionByUrgency, type ModulePanelEntry } from "@/lib/modules/summary";

/**
 * Se esperan todos los resúmenes antes de pintar, en vez de transmitir cada
 * módulo por su cuenta dentro de su propio Suspense.
 *
 * No es una simplificación: no se puede a la vez transmitir y ordenar por
 * urgencia, porque el orden no se conoce hasta que llegaron todos los datos.
 * Con streaming la lista se reacomodaría sola mientras el usuario la mira. La
 * latencia total no empeora: sigue siendo la de la consulta más lenta.
 */
async function loadEntries(): Promise<ModulePanelEntry[]> {
  const withSummary = MODULES.filter((m) => MODULE_SUMMARIES[m.id]);

  return Promise.all(
    withSummary.map(async (mod) => ({
      module: mod,
      summary: await MODULE_SUMMARIES[mod.id](),
    })),
  );
}

export default async function Dashboard() {
  const { active, quiet } = partitionByUrgency(await loadEntries());
  const hayModulos = active.length > 0 || quiet.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hubby" subtitle="Todo en un solo lugar" />

      {!hayModulos ? (
        <EmptyState
          icon={SquaresFourIcon}
          title="Todavía no hay módulos"
          description="Cuando registres uno, aparece acá automáticamente."
        />
      ) : (
        <>
          {active.length > 0 && (
            // Una columna en móvil, tres en escritorio.
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {active.map(({ module: mod, summary }) => (
                <ModuleCard
                  key={mod.id}
                  href={`/${mod.slug}`}
                  slug={mod.slug}
                  icon={mod.icon}
                  label={mod.label}
                  detail={summary.detail}
                  badge={summary.urgency}
                  preview={summary.preview}
                />
              ))}
            </div>
          )}

          {/* Lo resuelto se colapsa a una línea: con varios módulos, los que no
              piden nada dejan de competir por la atención. */}
          {quiet.length > 0 && (
            <ListGroup title="Al día">
              {quiet.map(({ module: mod, summary }, i) => {
                const ModIcon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    href={`/${mod.slug}`}
                    className="block"
                  >
                    <ListRow
                      last={i === quiet.length - 1}
                      interactive
                      leading={<IconChip icon={ModIcon} />}
                      label={mod.label}
                      detail={summary.detail}
                    />
                  </Link>
                );
              })}
            </ListGroup>
          )}

          <ListGroup>
            <Link href="/ajustes" className="block">
              <ListRow
                last
                interactive
                leading={<IconChip icon={GearIcon} size="sm" />}
                label="Ajustes"
                detail="Cuenta y apariencia"
              />
            </Link>
          </ListGroup>
        </>
      )}
    </div>
  );
}
