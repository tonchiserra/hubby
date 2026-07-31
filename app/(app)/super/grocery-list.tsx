"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { EmptyState } from "@/components/hubby/empty-state";
import type { GroceryItem } from "@/lib/supabase/types";
import {
  addItem,
  clearDone,
  deleteItem,
  setQuantity,
  toggleItem,
} from "./actions";

type Patch =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "quantity"; id: string; quantity: number }
  | { type: "delete"; id: string }
  | { type: "clearDone" };

function apply(items: GroceryItem[], patch: Patch): GroceryItem[] {
  switch (patch.type) {
    case "toggle":
      return items.map((i) =>
        i.id === patch.id ? { ...i, done: patch.done } : i,
      );
    case "quantity":
      return items.map((i) =>
        i.id === patch.id ? { ...i, quantity: patch.quantity } : i,
      );
    case "delete":
      return items.filter((i) => i.id !== patch.id);
    case "clearDone":
      return items.filter((i) => !i.done);
  }
}

export function GroceryList({ items }: { items: GroceryItem[] }) {
  // El estado optimista hace que marcar un ítem se sienta instantáneo; React
  // lo revierte solo si la acción del servidor falla.
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
    // Se limpia antes de esperar al servidor: si algo falla, el mensaje de
    // error alcanza para entenderlo, y así se pueden cargar ítems seguidos.
    formRef.current?.reset();
    inputRef.current?.focus();
    const res = await addItem(formData);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} action={onAdd} className="flex gap-2">
        <Input
          ref={inputRef}
          name="name"
          placeholder="Agregar al carrito…"
          autoComplete="off"
          aria-label="Nombre del ítem"
          maxLength={120}
          required
        />
        <Input
          name="quantity"
          type="number"
          inputMode="numeric"
          defaultValue={1}
          min={1}
          aria-label="Cantidad"
          className="w-16 shrink-0 px-0 text-center font-mono"
        />
        <Button type="submit" size="icon" aria-label="Agregar">
          <PlusIcon size={22} weight="bold" />
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-footnote text-negative -mt-3 px-1">
          {error}
        </p>
      )}

      {shown.length === 0 && (
        <EmptyState
          icon={ShoppingCartIcon}
          title="Lista vacía"
          description="Agregá lo primero que se te ocurra que falta en casa."
        />
      )}

      {pending.length > 0 && (
        <ListGroup title={`Pendientes · ${pending.length}`}>
          {pending.map((item) => (
            <ListRow
              key={item.id}
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
              trailing={
                <Stepper
                  quantity={item.quantity}
                  name={item.name}
                  onChange={(q) =>
                    run({ type: "quantity", id: item.id, quantity: q }, () =>
                      setQuantity(item.id, q),
                    )
                  }
                  onDelete={() =>
                    run({ type: "delete", id: item.id }, () =>
                      deleteItem(item.id),
                    )
                  }
                />
              }
            />
          ))}
        </ListGroup>
      )}

      {done.length > 0 && (
        <div className="flex flex-col gap-2">
          <ListGroup title={`Comprados · ${done.length}`}>
            {done.map((item) => (
              <ListRow
                key={item.id}
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
                  <span className="text-muted-foreground line-through">
                    {item.name}
                  </span>
                }
                trailing={
                  <span className="font-mono tabular-nums">×{item.quantity}</span>
                }
              />
            ))}
          </ListGroup>
          <Button
            variant="plain"
            size="sm"
            className="text-negative self-start"
            onClick={() =>
              run({ type: "clearDone" }, () => clearDone())
            }
          >
            <TrashIcon size={16} />
            Limpiar comprados
          </Button>
        </div>
      )}
    </div>
  );
}

function Stepper({
  quantity,
  name,
  onChange,
  onDelete,
}: {
  quantity: number;
  name: string;
  onChange: (q: number) => void;
  onDelete: () => void;
}) {
  // Bajar de 1 borra el ítem: es el gesto natural y evita un botón extra.
  const decrease = () => (quantity <= 1 ? onDelete() : onChange(quantity - 1));

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={decrease}
        aria-label={quantity <= 1 ? `Quitar ${name}` : `Menos ${name}`}
        className="text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-full transition-colors active:scale-90"
      >
        {quantity <= 1 ? <TrashIcon size={16} /> : <MinusIcon size={16} />}
      </button>
      <span className="w-5 text-center font-mono tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Más ${name}`}
        className="text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-full transition-colors active:scale-90"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
