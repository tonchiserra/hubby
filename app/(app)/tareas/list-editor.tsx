"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { Field, Sheet, SheetActions } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import type { ResetKind, TaskList } from "@/lib/supabase/types";
import type { ListDraft } from "./actions";
import { NOMBRES_DIA, NOMBRES_MES, describirRegla } from "./reset";

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
  // La hoja se queda con la última lista mientras se cierra: así se va con el
  // formulario puesto en vez de vaciarse antes de terminar de bajar.
  const [ultima, setUltima] = useState({ open, lista });
  if (open && (ultima.lista !== lista || !ultima.open)) setUltima({ open, lista });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={ultima.lista ? "Editar lista" : "Nueva lista"}
    >
      {/* El formulario se remonta por lista, con `key`: así los campos nacen
          ya sembrados en vez de sincronizarse con un efecto. */}
      {ultima.open && (
        <Formulario
          key={ultima.lista?.id ?? "nueva"}
          lista={ultima.lista}
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
    </Sheet>
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

  // Borrar se lleva la lista y todas sus tareas: pide un segundo toque.
  const [confirmando, setConfirmando] = useState(false);

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
      <div className="flex flex-col gap-5">
        <Field label="Nombre" htmlFor="lista-nombre">
          <input
            id="lista-nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            data-autofocus
            placeholder="Cuentas del mes"
            className="field"
          />
        </Field>

        <Field label="Se reinicia">
          <Segmented
            name={`reinicio-${lista?.id ?? "nueva"}`}
            label="Se reinicia"
            value={kind}
            onChange={setKind}
            segments={[
              { value: "nunca", label: "Nunca" },
              { value: "semanal", label: "Semana" },
              { value: "mensual", label: "Mes" },
              { value: "anual", label: "Año" },
            ]}
          />
        </Field>

        {/* Con `key` en la frecuencia: al cambiarla, los campos nuevos entran
            en vez de aparecer de golpe. */}
        <div key={kind} className="flex flex-col gap-5 empty:hidden animate-[rise_0.35s_var(--ease-out-kit)_both]">
          {kind === "semanal" && (
            <Field label="Qué día">
              <div className="flex gap-1.5">
                {NOMBRES_DIA.map((nombre, i) => (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => setDiaSemana(i)}
                    aria-pressed={diaSemana === i}
                    className={cn(
                      "text-footnote h-10 flex-1 rounded-full font-semibold",
                      "transition-[background-color,color,transform] duration-200 ease-out active:scale-95",
                      diaSemana === i
                        ? "bg-accent text-accent-ink"
                        : "bg-sand text-ink-soft hover:text-ink",
                    )}
                  >
                    {nombre}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {kind === "mensual" && (
            <Field label="Qué día del mes" htmlFor="lista-dia">
              <select
                id="lista-dia"
                value={diaMes}
                onChange={(e) => setDiaMes(Number(e.target.value))}
                className="field cifra"
              >
                {DIAS_DEL_MES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {kind === "anual" && (
            <Field label="Qué fecha">
              <div className="flex gap-3">
                <select
                  value={diaMes}
                  onChange={(e) => setDiaMes(Number(e.target.value))}
                  aria-label="Día"
                  className="field cifra w-20"
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
                  className="field"
                >
                  {NOMBRES_MES.map((nombre, i) => (
                    <option key={nombre} value={i + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
          )}
        </div>

        {/* La regla en palabras, armada con la misma función que la muestra
            abajo de la lista: lo que se lee acá es exactamente lo que va a
            pasar, sin tener que guardar para descubrirlo. */}
        <p className="text-footnote text-ink-soft bg-sand rounded-lg px-4 py-3 text-balance">
          {describirRegla(draft)}
        </p>

        {onDelete &&
          (confirmando ? (
            <div
              role="alert"
              className="bg-danger-wash flex flex-col gap-3 rounded-lg p-4 animate-[rise_0.3s_var(--ease-out-kit)_both]"
            >
              <p className="text-footnote text-ink">
                Se borran la lista y todas sus tareas. No se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="quiet" onClick={() => setConfirmando(false)}>
                  No, dejarla
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onDelete}
                  className="bg-danger text-paper hover:bg-danger hover:brightness-95"
                >
                  <TrashIcon size={16} />
                  Sí, borrar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmando(true)}
              className="self-start -ml-3"
            >
              Borrar lista y sus tareas
            </Button>
          ))}
      </div>

      <SheetActions>
        <Button type="button" variant="soft" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!limpio}>
          Guardar
        </Button>
      </SheetActions>
    </form>
  );
}

const DIAS_DEL_MES = Array.from({ length: 31 }, (_, i) => i + 1);
