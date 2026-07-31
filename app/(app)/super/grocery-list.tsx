"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { PlusCircleIcon, ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { InlineInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import type { GroceryItem } from "@/lib/supabase/types";
import { addItem, clearDone, deleteItem, toggleItem } from "./actions";

type Patch =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string }
  | { type: "clearDone" };

function apply(items: GroceryItem[], patch: Patch): GroceryItem[] {
  switch (patch.type) {
    case "toggle":
      return items.map((i) =>
        i.id === patch.id ? { ...i, done: patch.done } : i,
      );
    case "delete":
      return items.filter((i) => i.id !== patch.id);
    case "clearDone":
      return items.filter((i) => !i.done);
  }
}

export function GroceryList({ items }: { items: GroceryItem[] }) {
  const [shown, addPatch] = useOptimistic(items, apply);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const pending = shown.filter((i) => !i.done);
  const done = shown.filter((i) => i.done);

  async function onAdd(formData: FormData) {
    setError(null);
    // Se limpia antes de esperar al servidor para poder cargar varios seguidos.
    formRef.current?.reset();
    inputRef.current?.focus();
    const res = await addItem(formData);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* El alta es una fila más de la lista, como en Recordatorios, en vez de
          un formulario web arriba de todo. */}
      <ListGroup>
        <form ref={formRef} action={onAdd}>
          <ListRow
            last
            leading={<PlusCircleIcon size={22} className="text-primary" />}
            label={
              <InlineInput
                ref={inputRef}
                name="name"
                placeholder="Agregar al carrito"
                autoComplete="off"
                aria-label="Nombre del ítem"
                maxLength={120}
                required
              />
            }
            trailing={
              <input
                name="quantity"
                type="number"
                inputMode="numeric"
                defaultValue={1}
                min={1}
                aria-label="Cantidad"
                className="text-body text-muted-foreground w-10 bg-transparent text-right tabular-nums focus:outline-none"
              />
            }
          />
          <button type="submit" className="sr-only">
            Agregar
          </button>
        </form>
      </ListGroup>

      {error && (
        <p role="alert" className="text-footnote text-destructive -mt-6 px-4">
          {error}
        </p>
      )}

      {shown.length === 0 && (
        <EmptyState
          icon={ShoppingCartIcon}
          title="Lista vacía"
          description="Agregá lo primero que falte en casa."
        />
      )}

      {pending.length > 0 && (
        <ListGroup
          title="Pendientes"
          footer="Deslizá una fila hacia la izquierda para borrarla."
        >
          {pending.map((item, i) => (
            <SwipeRow
              key={item.id}
              deleteLabel={`Borrar ${item.name}`}
              onDelete={() =>
                run({ type: "delete", id: item.id }, () => deleteItem(item.id))
              }
            >
              <ListRow
                last={i === pending.length - 1}
                leading={
                  <Checkbox
                    checked={item.done}
                    aria-label={`Marcar ${item.name} como comprado`}
                    onCheckedChange={(v) =>
                      run({ type: "toggle", id: item.id, done: v === true }, () =>
                        toggleItem(item.id, v === true),
                      )
                    }
                  />
                }
                label={item.name}
                trailing={item.quantity > 1 ? `${item.quantity}` : undefined}
              />
            </SwipeRow>
          ))}
        </ListGroup>
      )}

      {done.length > 0 && (
        <ListGroup title={`Comprados · ${done.length}`}>
          {done.map((item, i) => (
            <SwipeRow
              key={item.id}
              deleteLabel={`Borrar ${item.name}`}
              onDelete={() =>
                run({ type: "delete", id: item.id }, () => deleteItem(item.id))
              }
            >
              <ListRow
                last={i === done.length - 1}
                leading={
                  <Checkbox
                    checked
                    aria-label={`Desmarcar ${item.name}`}
                    onCheckedChange={() =>
                      run({ type: "toggle", id: item.id, done: false }, () =>
                        toggleItem(item.id, false),
                      )
                    }
                  />
                }
                label={
                  <span className="text-muted-foreground">{item.name}</span>
                }
                trailing={item.quantity > 1 ? `${item.quantity}` : undefined}
              />
            </SwipeRow>
          ))}
        </ListGroup>
      )}

      {done.length > 0 && (
        <Button
          variant="plain"
          className="text-destructive self-center"
          onClick={() => run({ type: "clearDone" }, () => clearDone())}
        >
          Borrar los comprados
        </Button>
      )}
    </div>
  );
}
