import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { getLists } from "./queries";
import { Tasks } from "./tasks";

export const metadata = { title: "Tareas" };

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

export default async function TareasPage() {
  const lists = await getLists();
  const pendientes = lists.reduce(
    (n, l) => n + l.tasks.filter((t) => !t.done).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("tareas")}
        title="Tareas"
        subtitle={
          lists.length === 0
            ? "Sin listas todavía"
            : pendientes === 0
              ? `Todo hecho · ${plural(lists.length, "lista", "listas")}`
              : `${plural(pendientes, "pendiente", "pendientes")} · ${plural(lists.length, "lista", "listas")}`
        }
      />
      <Tasks lists={lists} />
    </div>
  );
}
