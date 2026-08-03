"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowSquareOutIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Tag } from "@/components/ui/tag";
import { Segmented } from "@/components/ui/segmented";
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
import type { Wish, WishStatus } from "@/lib/supabase/types";
import { WishEditor, type WishDraft } from "./wish-editor";
import { addWish, deleteWish, updateWish } from "./actions";
import { formatPrice, storeName } from "./money";

/**
 * Normaliza para comparar: sin acentos, sin mayúsculas, sin espacios de más.
 * Es lo que hace que buscar "auriculares" encuentre "Auriculares" — y por lo
 * tanto lo que evita agregar un duplicado sin darse cuenta.
 */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const ETIQUETA: Record<WishStatus, string> = {
  quiero: "Algún día",
  proximo: "Próximo",
  comprado: "Comprado",
};

/**
 * Un toque avanza el estado. El ciclo vuelve a empezar en 'quiero' para que un
 * toque de más no sea un callejón sin salida: si te pasaste, seguís tocando.
 */
/** Lo decidido primero, lo comprado al final. */
const RANGO: Record<WishStatus, number> = { proximo: 0, quiero: 1, comprado: 2 };

type Filter = "todo" | "pendientes" | "comprados";

type Patch =
  | { type: "save"; id: string; draft: WishDraft }
  | { type: "delete"; id: string };

function apply(wishes: Wish[], patch: Patch): Wish[] {
  switch (patch.type) {
    case "save":
      return wishes.map((w) =>
        w.id === patch.id
          ? {
              ...w,
              title: patch.draft.title,
              price: patch.draft.price,
              url: patch.draft.url,
              status: patch.draft.status,
            }
          : w,
      );
    case "delete":
      return wishes.filter((w) => w.id !== patch.id);
  }
}

export function Wishlist({ wishes }: { wishes: Wish[] }) {
  const [shown, addPatch] = useOptimistic(wishes, apply);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todo");
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Wish | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const q = norm(query);

  const { visible, pendientes, comprados, exists } = useMemo(() => {
    const coinciden = q ? shown.filter((w) => norm(w.title).includes(q)) : shown;

    // El orden se arma acá y no en la consulta: 'proximo' tiene que ir antes
    // que 'quiero', que no es el orden alfabético de esas palabras. El sort de
    // JS es estable, así que dentro de cada estado se conserva el de la base
    // -lo último anotado primero-.
    const ordenados = [...coinciden].sort(
      (a, b) => RANGO[a.status] - RANGO[b.status],
    );

    return {
      visible: ordenados.filter((w) =>
        filter === "todo"
          ? true
          : filter === "comprados"
            ? w.status === "comprado"
            : w.status !== "comprado",
      ),
      pendientes: shown.filter((w) => w.status !== "comprado").length,
      comprados: shown.filter((w) => w.status === "comprado").length,
      exists: q ? shown.some((w) => norm(w.title) === q) : false,
    };
  }, [shown, q, filter]);

  async function onAdd() {
    const title = query.trim();
    if (!title || exists) return;
    setError(null);
    setQuery("");
    inputRef.current?.focus();
    // Se agrega solo con el nombre: anotar tiene que costar una línea. El
    // precio y el link se cargan después, editando, cuando los averiguaste.
    const res = await addWish({ title });
    if (res?.error) setError(res.error);
  }

  const buscando = q.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Un solo campo para buscar y agregar: al escribir ves si el deseo ya
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
          placeholder="Buscar o anotar algo que querés"
          aria-label="Buscar o anotar algo que querés"
          autoComplete="off"
          maxLength={200}
          className="text-body placeholder:text-ink-faint min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        {buscando && (
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
        name="filtro-deseos"
        value={filter}
        onChange={setFilter}
        segments={[
          { value: "todo", label: "Todo", count: shown.length },
          { value: "pendientes", label: "Los quiero", count: pendientes },
          { value: "comprados", label: "Comprados", count: comprados },
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
        {buscando && !exists && (
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
                    Anotar <span className="font-semibold">{query.trim()}</span>
                  </span>
                }
              />
            </ListGroup>
          </motion.div>
        )}
      </AnimatePresence>

      {shown.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Todavía no querés nada"
          description="Anotá arriba lo primero que se te ocurra. Después le ponés el precio y el link de dónde comprarlo."
        />
      ) : (
        <ListGroup footer="Deslizá un deseo para editarlo o borrarlo.">
          {/* La animación va acá afuera y no dentro de SwipeRow: ese componente
              maneja transform a mano durante el gesto y se pelearían por la
              misma propiedad. */}
          <AnimatePresence initial={false}>
            {visible.map((wish, i) => (
              <motion.div
                key={wish.id}
                layout
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springLayout}
                className="overflow-hidden"
              >
                <Ficha
                  wish={wish}
                  last={i === visible.length - 1}
                  onEdit={() => setEditando(wish)}
                  onDelete={() =>
                    run({ type: "delete", id: wish.id }, () => deleteWish(wish.id))
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
            {buscando
              ? `Nada coincide con “${query.trim()}”.`
              : filter === "comprados"
                ? "Todavía no compraste nada de la lista."
                : "Ya compraste todo lo que querías."}
          </motion.p>
        )}
      </AnimatePresence>

      <WishEditor
        wish={editando}
        onOpenChange={(open) => !open && setEditando(null)}
        onSave={(draft) => {
          const wish = editando;
          if (!wish) return;
          setError(null);
          run({ type: "save", id: wish.id, draft }, () =>
            updateWish(wish.id, draft),
          );
        }}
      />
    </div>
  );
}

/**
 * Fila de deseo, entera de solo lectura.
 *
 * Todo se edita desde el formulario, incluido el estado: es la regla que Gonzalo
 * fijó en Libros después de probar la alternativa. Recorrer la lista no puede
 * cambiar nada por accidente, y con el swipe abierto un toque suelto es fácil.
 */
function Ficha({
  wish,
  last,
  onEdit,
  onDelete,
}: {
  wish: Wish;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const comprado = wish.status === "comprado";
  const tienda = wish.url ? storeName(wish.url) : null;

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
      <article
        className={cn(
          "bg-card flex items-center gap-3 px-4 py-3",
          !last && "hairline-b",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="min-w-0">
            <h3
              className={cn(
                "text-body line-clamp-1",
                // Lo comprado ya no es una decisión pendiente: se corre a un
                // segundo plano en vez de irse de la lista, porque saber qué te
                // compraste es la mitad de para qué sirve una lista de deseos.
                comprado ? "text-ink-soft" : "text-ink font-medium",
              )}
            >
              {wish.title}
            </h3>
            {tienda && (
              <p className="text-micro text-ink-faint truncate">{tienda}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Tag variant={wish.status === "proximo" ? "accent" : "wash"}>
              {ETIQUETA[wish.status]}
            </Tag>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {wish.price !== null && (
            <span
              className={cn(
                "text-subhead tabular-nums",
                comprado ? "text-ink-faint" : "text-ink-soft",
              )}
            >
              {formatPrice(wish.price)}
            </span>
          )}

          {wish.url && (
            // El link es el motivo de guardar la dirección, así que se abre
            // desde la fila y no desde el editor. En pestaña nueva: volver a
            // hubby no debería costar perder el lugar en la lista.
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir dónde comprar ${wish.title}`}
              className="text-accent hover:bg-card-sunken grid size-9 place-items-center rounded-full transition-colors"
            >
              <ArrowSquareOutIcon size={17} weight="bold" />
            </a>
          )}
        </div>
      </article>
    </SwipeRow>
  );
}
