"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BasketIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Segmented } from "@/components/ui/segmented";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import { cn } from "@/lib/utils";
import {
  blockVariants,
  easeQuick,
  rowVariants,
  springEnter,
  springLayout,
} from "@/lib/motion";
import type { GroceryItem } from "@/lib/supabase/types";
import {
  addItem,
  deleteItem,
  markAllBought,
  renameItem,
  setActive,
} from "./actions";

/**
 * Normaliza para comparar: sin acentos, sin mayúsculas, sin espacios de más.
 * Es lo que hace que buscar "cafe" encuentre "Café" — y por lo tanto lo que
 * evita agregar un duplicado sin darse cuenta.
 */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

type Filter = "todo" | "faltan" | "casa";

type Patch =
  | { type: "active"; id: string; active: boolean }
  | { type: "rename"; id: string; name: string }
  | { type: "delete"; id: string }
  | { type: "allBought" };

function apply(items: GroceryItem[], patch: Patch): GroceryItem[] {
  switch (patch.type) {
    case "active":
      return items.map((i) =>
        i.id === patch.id ? { ...i, active: patch.active } : i,
      );
    case "rename":
      return items.map((i) =>
        i.id === patch.id ? { ...i, name: patch.name } : i,
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
  const [filter, setFilter] = useState<Filter>("todo");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const q = norm(query);

  const { visible, missingCount, homeCount, exists } = useMemo(() => {
    const matched = q ? shown.filter((i) => norm(i.name).includes(q)) : shown;
    return {
      visible: matched.filter((i) =>
        filter === "todo" ? true : filter === "faltan" ? !i.active : i.active,
      ),
      missingCount: shown.filter((i) => !i.active).length,
      homeCount: shown.filter((i) => i.active).length,
      exists: q ? shown.some((i) => norm(i.name) === q) : false,
    };
  }, [shown, q, filter]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Un solo campo para buscar y agregar: al escribir ves si el producto ya
          existe, así el duplicado se evita antes de crearlo. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onAdd();
        }}
        className="bg-sand flex h-touch items-center gap-2 rounded-lg px-3.5"
      >
        <MagnifyingGlassIcon
          size={18}
          weight="bold"
          className="text-accent shrink-0 opacity-70"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar o agregar producto"
          aria-label="Buscar o agregar producto"
          autoComplete="off"
          maxLength={120}
          className="text-body placeholder:text-ink-faint min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        {searching && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="text-ink-faint shrink-0"
          >
            <XCircleIcon size={20} weight="fill" />
          </button>
        )}
      </form>

      <Segmented
        name="filtro-supermercado"
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "todo", label: "Todo", count: shown.length },
          { value: "faltan", label: "Faltan", count: missingCount },
          { value: "casa", label: "En casa", count: homeCount },
        ]}
      />

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

        {/* Solo se ofrece agregar si el nombre no existe: es la defensa
            principal contra los repetidos. */}
        {searching && !exists && (
          <motion.div
            key="add"
            variants={blockVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springEnter}
            className="overflow-hidden"
          >
            <ListGroup>
              <ListRow
                last
                asButton
                onClick={() => void onAdd()}
                leading={<PlusCircleIcon size={22} className="text-accent" />}
                label={
                  <span>
                    Agregar <span className="font-semibold">{query.trim()}</span>
                  </span>
                }
              />
            </ListGroup>
          </motion.div>
        )}
      </AnimatePresence>

      {shown.length === 0 ? (
        <EmptyState
          icon={BasketIcon}
          title="Inventario vacío"
          description="Escribí arriba lo primero que quieras tener anotado. La lista se arma una sola vez y después solo la vas marcando."
        />
      ) : (
        // Una sola lista: al marcar, el producto se queda donde está. El orden
        // es alfabético justamente para que nada salte de lugar al tocarlo.
        <ListGroup footer="Deslizá un producto para editarlo o borrarlo.">
          {/* La animación va acá afuera y no dentro de SwipeRow: ese componente
              maneja transform a mano durante el gesto y se pelearían por la
              misma propiedad. */}
          {/* Modo sync a propósito: con popLayout las filas que salen se
              quitan del flujo al instante y la tarjeta colapsa de golpe. Acá
              se quedan ocupando lugar mientras animan su altura a cero, así el
              contenedor se encoge acompañando el movimiento. */}
          <AnimatePresence initial={false}>
            {visible.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springLayout}
                className="overflow-hidden"
              >
                <ItemRow
                  item={item}
                  last={i === visible.length - 1}
                  onToggle={() =>
                    run(
                      { type: "active", id: item.id, active: !item.active },
                      () => setActive(item.id, !item.active),
                    )
                  }
                  onEdit={() => setEditing(item)}
                  onDelete={() =>
                    run({ type: "delete", id: item.id }, () =>
                      deleteItem(item.id),
                    )
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </ListGroup>
      )}

      <AnimatePresence initial={false}>
        {shown.length > 0 && visible.length === 0 && (
          <motion.p
            key="vacio"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={easeQuick}
            className="text-subhead text-ink-soft px-4 py-8 text-center"
          >
            {searching
              ? `Nada coincide con “${query.trim()}”.`
              : filter === "faltan"
                ? "No falta nada. Todo lo que tenés anotado está en casa."
                : "Todavía no marcaste nada como que lo tenés en casa."}
          </motion.p>
        )}

        {missingCount > 0 && (
          <motion.div
            key="comprar-todo"
            layout
            variants={blockVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springEnter}
            className="flex justify-center overflow-hidden pt-2"
          >
            <Button
              variant="soft"
              onClick={() => run({ type: "allBought" }, () => markAllBought())}
            >
              Ya compré todo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <PromptDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Renombrar producto"
        initialValue={editing?.name ?? ""}
        placeholder="Nombre del producto"
        maxLength={120}
        onConfirm={(name) => {
          const item = editing;
          if (!item) return;
          setError(null);
          run({ type: "rename", id: item.id, name }, () =>
            renameItem(item.id, name),
          );
        }}
      />
    </div>
  );
}

function ItemRow({
  item,
  last,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: GroceryItem;
  last: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // El checkbox es el control real -accesible por teclado y con su rol- y el
  // nombre es su <label>, así tocar cualquier parte de la fila lo alterna.
  const inputId = `item-${item.id}`;

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
        last={last}
        // Lo que falta es lo accionable, así que se lee primero: fondo apenas
        // teñido y texto a plena fuerza. Lo que ya está en casa se corre a un
        // segundo plano.
        className={cn(!item.active && "bg-accent-wash")}
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
          <label
            htmlFor={inputId}
            className={cn(
              "block cursor-pointer select-none",
              item.active
                ? "text-ink-soft"
                : "text-ink font-medium",
            )}
          >
            {item.name}
          </label>
        }
        trailing={
          !item.active ? (
            <span className="bg-accent text-accent-ink rounded-full px-2 py-0.5 text-micro font-semibold tracking-wide uppercase">
              Falta
            </span>
          ) : undefined
        }
      />
    </SwipeRow>
  );
}
