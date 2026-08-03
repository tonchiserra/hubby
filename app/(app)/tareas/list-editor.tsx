"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";

import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import type { ResetKind, TaskList } from "@/lib/supabase/types";
import type { ListDraft } from "./actions";
import { NOMBRES_DIA, NOMBRES_MES, describirRegla } from "./reset";

const CAMPO =
  "bg-sand text-body text-ink h-10 w-full rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-accent/35";

/**
 * Alta y edición de una lista. Es el único lugar donde se define el reinicio,
 * que es lo que distingue a este módulo: el resto de la pantalla es marcar y
 * desmarcar, y no puede cambiar la configuración por accidente.
 */
export function ListEditor({
  open,
  lista,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  /** `null` es una lista nueva. */
  lista: TaskList | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ListDraft) => void;
  onDelete?: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[min(23rem,calc(100vw-2rem))]",
            "-translate-x-1/2 -translate-y-1/2",
            "bg-card max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-lg shadow-float",
          )}
        >
          {/* El formulario se remonta por lista, con `key`: así los campos nacen
              ya sembrados en vez de sincronizarse con un efecto. */}
          {open && (
            <Formulario
              key={lista?.id ?? "nueva"}
              lista={lista}
              onCancel={() => onOpenChange(false)}
              onSave={(draft) => {
                onSave(draft);
                onOpenChange(false);
              }}
              onDelete={
                onDelete &&
                (() => {
                  onDelete();
                  onOpenChange(false);
                })
              }
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Formulario({
  lista,
  onCancel,
  onSave,
  onDelete,
}: {
  lista: TaskList | null;
  onCancel: () => void;
  onSave: (draft: ListDraft) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(lista?.name ?? "");
  const [kind, setKind] = useState<ResetKind>(lista?.reset_kind ?? "nunca");
  // Un solo estado para el día aunque signifique cosas distintas según la
  // frecuencia -día de semana o día del mes- sería una fuente de valores fuera
  // de rango al cambiar de una a otra. Cada uno tiene el suyo, con su default.
  const [diaSemana, setDiaSemana] = useState(
    lista?.reset_kind === "semanal" ? (lista.reset_day ?? 1) : 1,
  );
  const [diaMes, setDiaMes] = useState(
    lista?.reset_kind === "mensual" || lista?.reset_kind === "anual"
      ? (lista.reset_day ?? 1)
      : 1,
  );
  const [mes, setMes] = useState(lista?.reset_month ?? 1);

  const limpio = name.trim();

  const draft: ListDraft = {
    name: limpio,
    reset_kind: kind,
    reset_day:
      kind === "nunca"
        ? null
        : kind === "semanal"
          ? diaSemana
          : diaMes,
    reset_month: kind === "anual" ? mes : null,
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!limpio) return;
        onSave(draft);
      }}
    >
      <div className="flex flex-col gap-4 px-4 pt-4 pb-5">
        <Dialog.Title className="text-headline text-center">
          {lista ? "Editar lista" : "Nueva lista"}
        </Dialog.Title>

        <Campo etiqueta="Nombre">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoFocus
            placeholder="Cuentas del mes"
            aria-label="Nombre de la lista"
            className={cn(CAMPO, "placeholder:text-ink-faint")}
          />
        </Campo>

        <Campo etiqueta="Se reinicia">
          <Segmented
            name={`reinicio-${lista?.id ?? "nueva"}`}
            value={kind}
            onChange={setKind}
            segments={[
              { value: "nunca", label: "Nunca" },
              { value: "semanal", label: "Semana" },
              { value: "mensual", label: "Mes" },
              { value: "anual", label: "Año" },
            ]}
          />
        </Campo>

        {kind === "semanal" && (
          <Campo etiqueta="Qué día">
            <div className="flex gap-1.5">
              {NOMBRES_DIA.map((nombre, i) => (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => setDiaSemana(i)}
                  aria-pressed={diaSemana === i}
                  className={cn(
                    "text-footnote h-10 flex-1 rounded-md font-medium transition-colors",
                    diaSemana === i
                      ? "bg-accent text-accent-ink"
                      : "bg-sand text-ink-soft hover:text-ink",
                  )}
                >
                  {nombre}
                </button>
              ))}
            </div>
          </Campo>
        )}

        {kind === "mensual" && (
          <Campo etiqueta="Qué día del mes">
            <select
              value={diaMes}
              onChange={(e) => setDiaMes(Number(e.target.value))}
              aria-label="Día del mes"
              className={cn(CAMPO, "tabular-nums")}
            >
              {DIAS_DEL_MES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {kind === "anual" && (
          <Campo etiqueta="Qué fecha">
            <div className="flex gap-2">
              <select
                value={diaMes}
                onChange={(e) => setDiaMes(Number(e.target.value))}
                aria-label="Día"
                className={cn(CAMPO, "w-20 tabular-nums")}
              >
                {DIAS_DEL_MES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                aria-label="Mes"
                className={CAMPO}
              >
                {NOMBRES_MES.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
          </Campo>
        )}

        {/* La regla en palabras, armada con la misma función que la muestra
            abajo de la lista: lo que se lee acá es exactamente lo que va a
            pasar, sin tener que guardar para descubrirlo. */}
        <p className="text-footnote text-ink-soft text-balance">
          {describirRegla(draft)}
        </p>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-footnote text-danger hover:bg-danger-wash mt-1 flex h-10 items-center justify-center gap-1.5 rounded-md font-medium transition-colors"
          >
            <TrashIcon size={16} weight="bold" />
            Borrar lista y sus tareas
          </button>
        )}
      </div>

      <div className="border-line grid grid-cols-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="text-body text-ink-soft border-line h-12 border-r active:bg-card-sunken"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!limpio}
          className="text-body text-accent h-12 font-semibold active:bg-card-sunken disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

const DIAS_DEL_MES = Array.from({ length: 31 }, (_, i) => i + 1);

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-micro text-ink-soft font-medium tracking-wide uppercase">
        {etiqueta}
      </span>
      {children}
    </label>
  );
}
