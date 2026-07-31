"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  BasketIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import type { GroceryItem } from "@/lib/supabase/types";
import { addItem, deleteItem, markAllBought, setActive } from "./actions";

/**
 * Normaliza para comparar: sin acentos, sin mayúsculas, sin espacios de más.
 * Es lo que hace que buscar "cafe" encuentre "Café" — y por lo tanto lo que
 * evita que agregues un duplicado sin darte cuenta.
 */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

type Patch =
  | { type: "active"; id: string; active: boolean }
  | { type: "delete"; id: string }
  | { type: "allBought" };

function apply(items: GroceryItem[], patch: Patch): GroceryItem[] {
  switch (patch.type) {
    case "active":
      return items.map((i) =>
        i.id === patch.id ? { ...i, active: patch.active } : i,
      );
    case "delete":
      return items.filter((i) => i.id !== patch.id);
    case "allBought":
      return items.map((i) => ({ ...i, active: true }));
  }
}

export function Pantry({ items }: { items: GroceryItem[] }) {
  const [shown, addPatch] = useOptimistic(items, apply);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const q = norm(query);

  const { missing, home, exists } = useMemo(() => {
    const matches = q ? shown.filter((i) => norm(i.name).includes(q)) : shown;
    return {
      missing: matches.filter((i) => !i.active),
      home: matches.filter((i) => i.active),
      exists: q ? shown.some((i) => norm(i.name) === q) : false,
    };
  }, [shown, q]);

  async function onAdd() {
    const name = query.trim();
    if (!name || exists) return;
    setError(null);
    setQuery("");
    inputRef.current?.focus();
    const res = await addItem(name);
    if (res?.error) setError(res.error);
  }

  const searching = q.length > 0;
  const nothingFound = searching && missing.length === 0 && home.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Un solo campo para las dos cosas: buscar y agregar. Al escribir ves si
          el producto ya existe, así que el duplicado se evita antes de crearlo
          en vez de rechazarlo después con un error. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onAdd();
        }}
        className="bg-fill-tertiary flex h-touch items-center gap-2 rounded-md px-3"
      >
        <MagnifyingGlassIcon
          size={18}
          weight="bold"
          className="text-subtle-foreground shrink-0"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar o agregar producto"
          aria-label="Buscar o agregar producto"
          autoComplete="off"
          maxLength={120}
          enterKeyHint={exists ? "search" : "done"}
          className="text-body placeholder:text-subtle-foreground min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        {searching && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="text-subtle-foreground shrink-0"
          >
            <XCircleIcon size={20} weight="fill" />
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="text-footnote text-destructive -mt-6 px-4">
          {error}
        </p>
      )}

      {/* Solo se ofrece agregar si no existe ya: es la defensa principal contra
          los repetidos. */}
      {searching && !exists && (
        <ListGroup>
          <ListRow
            last
            asButton
            onClick={() => void onAdd()}
            leading={<PlusCircleIcon size={22} className="text-primary" />}
            label={
              <span>
                Agregar <span className="font-semibold">{query.trim()}</span>
              </span>
            }
          />
        </ListGroup>
      )}

      {shown.length === 0 && (
        <EmptyState
          icon={BasketIcon}
          title="Inventario vacío"
          description="Escribí arriba lo primero que quieras tener anotado. La lista se arma una sola vez y después solo la vas marcando."
        />
      )}

      {nothingFound && shown.length > 0 && (
        <p className="text-subhead text-muted-foreground px-4 text-center">
          Nada coincide con “{query.trim()}”.
        </p>
      )}

      {missing.length > 0 && (
        <ListGroup
          title={`Hay que comprar · ${missing.length}`}
          footer="Tocá un producto cuando lo compres. Deslizá para sacarlo del inventario."
        >
          {missing.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              last={i === missing.length - 1}
              onToggle={() =>
                run({ type: "active", id: item.id, active: true }, () =>
                  setActive(item.id, true),
                )
              }
              onDelete={() =>
                run({ type: "delete", id: item.id }, () => deleteItem(item.id))
              }
            />
          ))}
        </ListGroup>
      )}

      {home.length > 0 && (
        <ListGroup
          title={`En casa · ${home.length}`}
          footer={
            missing.length === 0 && !searching
              ? "Cuando se te termine algo, tocalo para pasarlo a la lista de compras."
              : undefined
          }
        >
          {home.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              last={i === home.length - 1}
              onToggle={() =>
                run({ type: "active", id: item.id, active: false }, () =>
                  setActive(item.id, false),
                )
              }
              onDelete={() =>
                run({ type: "delete", id: item.id }, () => deleteItem(item.id))
              }
            />
          ))}
        </ListGroup>
      )}

      {!searching && missing.length > 0 && (
        <Button
          variant="tinted"
          className="self-center"
          onClick={() => run({ type: "allBought" }, () => markAllBought())}
        >
          Ya compré todo
        </Button>
      )}
    </div>
  );
}

function ItemRow({
  item,
  last,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  last: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  // El checkbox es el control real -accesible por teclado y con su rol- y el
  // nombre es su <label>, así tocar cualquier parte de la fila lo alterna sin
  // necesidad de handlers sobre un div.
  const inputId = `item-${item.id}`;

  return (
    <SwipeRow deleteLabel={`Sacar ${item.name} del inventario`} onDelete={onDelete}>
      <ListRow
        last={last}
        leading={
          <Checkbox
            id={inputId}
            checked={item.active}
            onCheckedChange={onToggle}
            aria-label={
              item.active
                ? `Marcar que se terminó ${item.name}`
                : `Marcar ${item.name} como comprado`
            }
          />
        }
        label={
          <label htmlFor={inputId} className="block cursor-pointer select-none">
            {item.name}
          </label>
        }
      />
    </SwipeRow>
  );
}
