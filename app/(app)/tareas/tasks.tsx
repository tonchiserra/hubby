"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ListChecksIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import { cn } from "@/lib/utils";
import { blockVariants, rowVariants, springEnter, springLayout } from "@/lib/motion";
import type { Task } from "@/lib/supabase/types";
import {
  addList,
  addTask,
  deleteList,
  deleteTask,
  renameTask,
  setTaskDone,
  updateList,
  type ListDraft,
} from "./actions";
import type { ListWithTasks } from "./queries";
import { ListEditor } from "./list-editor";
import { describirRegla } from "./reset";

type Patch =
  | { type: "done"; id: string; done: boolean }
  | { type: "rename"; id: string; title: string }
  | { type: "delete"; id: string };

function apply(listas: ListWithTasks[], patch: Patch): ListWithTasks[] {
  const enTareas = (fn: (tasks: Task[]) => Task[]) =>
    listas.map((l) => ({ ...l, tasks: fn(l.tasks) }));

  switch (patch.type) {
    case "done":
      return enTareas((ts) =>
        ts.map((t) => (t.id === patch.id ? { ...t, done: patch.done } : t)),
      );
    case "rename":
      return enTareas((ts) =>
        ts.map((t) => (t.id === patch.id ? { ...t, title: patch.title } : t)),
      );
    case "delete":
      return enTareas((ts) => ts.filter((t) => t.id !== patch.id));
  }
}

export function Tasks({ lists }: { lists: ListWithTasks[] }) {
  const [shown, addPatch] = useOptimistic(lists, apply);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Cada diálogo guarda sobre qué está trabajando, no un booleano: así el
  // contenido nunca queda huérfano de su lista o su tarea mientras se cierra.
  const [editandoLista, setEditandoLista] = useState<ListWithTasks | null>(null);
  const [creandoLista, setCreandoLista] = useState(false);
  const [agregandoEn, setAgregandoEn] = useState<ListWithTasks | null>(null);
  const [renombrando, setRenombrando] = useState<Task | null>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  async function correr(action: () => Promise<{ error?: string }>) {
    setError(null);
    const res = await action();
    if (res?.error) setError(res.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="error"
            role="alert"
            variants={blockVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springEnter}
            className="text-footnote text-danger overflow-hidden px-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {shown.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title="Sin listas todavía"
          description="Armá una lista con lo que se repite -las cuentas del mes, la limpieza del finde- y elegí qué día vuelve todo a pendiente."
          action={
            <Button onClick={() => setCreandoLista(true)}>
              <PlusIcon size={17} weight="bold" />
              Crear lista
            </Button>
          }
        />
      ) : (
        <>
          <AnimatePresence initial={false}>
            {shown.map((lista) => (
              <motion.div
                key={lista.id}
                layout
                variants={blockVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springEnter}
              >
                <Lista
                  lista={lista}
                  onConfig={() => setEditandoLista(lista)}
                  onAddTask={() => setAgregandoEn(lista)}
                  onToggle={(t) =>
                    run({ type: "done", id: t.id, done: !t.done }, () =>
                      setTaskDone(t.id, !t.done),
                    )
                  }
                  onEditTask={setRenombrando}
                  onDeleteTask={(t) =>
                    run({ type: "delete", id: t.id }, () => deleteTask(t.id))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex justify-center pt-1">
            <Button variant="soft" onClick={() => setCreandoLista(true)}>
              <PlusIcon size={17} weight="bold" />
              Nueva lista
            </Button>
          </div>
        </>
      )}

      <PromptDialog
        open={agregandoEn !== null}
        onOpenChange={(open) => !open && setAgregandoEn(null)}
        title="Nueva tarea"
        description={agregandoEn?.name}
        placeholder="Qué hay que hacer"
        confirmLabel="Agregar"
        maxLength={200}
        onConfirm={(title) => {
          const lista = agregandoEn;
          if (!lista) return;
          void correr(() => addTask(lista.id, title));
        }}
      />

      <PromptDialog
        open={renombrando !== null}
        onOpenChange={(open) => !open && setRenombrando(null)}
        title="Renombrar tarea"
        initialValue={renombrando?.title ?? ""}
        maxLength={200}
        onConfirm={(title) => {
          const tarea = renombrando;
          if (!tarea) return;
          setError(null);
          run({ type: "rename", id: tarea.id, title }, () =>
            renameTask(tarea.id, title),
          );
        }}
      />

      <ListEditor
        open={creandoLista}
        lista={null}
        onOpenChange={setCreandoLista}
        onSave={(draft) => void correr(() => addList(draft))}
      />

      <ListEditor
        open={editandoLista !== null}
        lista={editandoLista}
        onOpenChange={(open) => !open && setEditandoLista(null)}
        onSave={(draft: ListDraft) => {
          const lista = editandoLista;
          if (!lista) return;
          void correr(() => updateList(lista.id, draft));
        }}
        onDelete={() => {
          const lista = editandoLista;
          if (!lista) return;
          void correr(() => deleteList(lista.id));
        }}
      />
    </div>
  );
}

function Lista({
  lista,
  onConfig,
  onAddTask,
  onToggle,
  onEditTask,
  onDeleteTask,
}: {
  lista: ListWithTasks;
  onConfig: () => void;
  onAddTask: () => void;
  onToggle: (t: Task) => void;
  onEditTask: (t: Task) => void;
  onDeleteTask: (t: Task) => void;
}) {
  const pendientes = lista.tasks.filter((t) => !t.done).length;

  return (
    <ListGroup
      title={lista.name}
      titleAction={
        <div className="flex shrink-0 items-center gap-2">
          {/* El número solo aparece si hay algo pendiente: "0" ocupa lugar para
              decir lo mismo que no mostrar nada. */}
          {pendientes > 0 && (
            <span className="text-caption text-ink-soft tabular-nums">
              {pendientes}
            </span>
          )}
          <button
            type="button"
            onClick={onConfig}
            aria-label={`Configurar ${lista.name}`}
            className="text-ink-faint hover:text-ink transition-colors"
          >
            <SlidersHorizontalIcon size={17} weight="bold" />
          </button>
        </div>
      }
      footer={describirRegla(lista)}
    >
      <AnimatePresence initial={false}>
        {lista.tasks.map((tarea) => (
          <motion.div
            key={tarea.id}
            layout
            variants={rowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springLayout}
            className="overflow-hidden"
          >
            <TaskRow
              tarea={tarea}
              onToggle={() => onToggle(tarea)}
              onEdit={() => onEditTask(tarea)}
              onDelete={() => onDeleteTask(tarea)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <ListRow
        last
        asButton
        onClick={onAddTask}
        leading={<PlusCircleIcon size={22} className="text-accent" />}
        label={<span className="text-ink-soft">Agregar tarea</span>}
      />
    </ListGroup>
  );
}

function TaskRow({
  tarea,
  onToggle,
  onEdit,
  onDelete,
}: {
  tarea: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // El checkbox es el control real -accesible por teclado y con su rol- y el
  // título es su <label>, así tocar cualquier parte de la fila lo alterna.
  const inputId = `tarea-${tarea.id}`;

  return (
    <SwipeRow
      actions={[
        { label: "Editar", icon: PencilSimpleIcon, onSelect: onEdit },
        {
          label: "Borrar",
          icon: TrashIcon,
          tone: "destructive",
          onSelect: onDelete,
        },
      ]}
    >
      <ListRow
        leading={
          <Checkbox
            id={inputId}
            checked={tarea.done}
            onCheckedChange={onToggle}
            aria-label={
              tarea.done
                ? `Marcar ${tarea.title} como pendiente`
                : `Marcar ${tarea.title} como hecha`
            }
          />
        }
        label={
          <label
            htmlFor={inputId}
            className={cn(
              "block cursor-pointer select-none",
              // Tachado, que en una lista de tareas es la convención y se lee
              // sin pensar. En Supermercado no se usa porque ahí marcar no
              // significa terminar algo, sino tenerlo en casa.
              tarea.done
                ? "text-ink-soft decoration-ink-faint line-through"
                : "text-ink font-medium",
            )}
          >
            {tarea.title}
          </label>
        }
      />
    </SwipeRow>
  );
}
