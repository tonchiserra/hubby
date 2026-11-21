"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from "@/components/ui/icons";

import { StarRating } from "@/components/ui/star-rating";
import { Tag } from "@/components/ui/tag";
import { BookEditor, type BookDraft } from "./book-editor";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import { ListGroup } from "@/components/hubby/list";
import { PresenceList, Reveal } from "@/components/hubby/presence";
import { useReorder } from "@/components/hubby/use-reorder";
import { cn } from "@/lib/utils";
import type { Book, BookStatus } from "@/lib/supabase/types";
import { addBook, deleteBook, reorderBooks, updateBook } from "./actions";
import { searchBooks, type BookResult } from "./open-library";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Cuánto hay que mantener apretado antes de que arranque el arrastre. */
const PRESION_MS = 400;
/** Movimiento horizontal que descarta el arrastre: eso es un swipe. */
const SLOP_PX = 8;

/** Lo que se espera a que dejes de escribir antes de consultar. */
const DEBOUNCE_MS = 400;

const ETIQUETA: Record<BookStatus, string> = {
  leyendo: "En progreso",
  quiero: "No leído",
  leido: "Leído",
};


type Patch =
  | { type: "save"; id: string; draft: BookDraft }
  | { type: "delete"; id: string };

function apply(books: Book[], patch: Patch): Book[] {
  switch (patch.type) {
    case "save":
      return books.map((b) =>
        b.id === patch.id
          ? {
              ...b,
              title: patch.draft.title,
              author: patch.draft.author,
              cover_url: patch.draft.coverUrl,
              status: patch.draft.status,
              format: patch.draft.format,
              rating: patch.draft.rating,
              read_year: patch.draft.readYear,
            }
          : b,
      );
    case "delete":
      return books.filter((b) => b.id !== patch.id);
  }
}

export function Library({ books }: { books: Book[] }) {
  const [shown, addPatch] = useOptimistic(books, apply);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Los resultados guardan la consulta que los produjo. Así "estoy buscando" y
  // "estos resultados ya no corresponden" se deducen comparando, en vez de
  // mantener dos estados más en sincronía a mano.
  const [busqueda, setBusqueda] = useState<{ q: string; res: BookResult[] } | null>(
    null,
  );
  const [editando, setEditando] = useState<Book | null>(null);
  const [ordenLocal, setOrdenLocal] = useState<Book[] | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  /**
   * Orden que se está viendo. Mientras arrastrás manda el local; cuando cambia
   * la composición de la lista -agregaste o borraste- se vuelve al del
   * servidor. Se deduce en el render, sin efectos que sincronicen nada.
   */
  const ordenados = useMemo(() => {
    if (!ordenLocal) return shown;

    const porId = new Map(shown.map((b) => [b.id, b]));
    const mismosLibros =
      ordenLocal.length === shown.length &&
      ordenLocal.every((b) => porId.has(b.id));

    // Se conserva el orden local pero con los datos frescos del servidor: si
    // editaste un libro mientras tanto, se ve el cambio sin perder tu orden.
    return mismosLibros ? ordenLocal.map((b) => porId.get(b.id)!) : shown;
  }, [ordenLocal, shown]);

  const q = query.trim();
  const corta = q.length < 3;
  // Derivados, no estados: mientras lo que hay guardado no corresponda a lo que
  // se está escribiendo, la búsqueda sigue en curso.
  const resultados = busqueda?.q === q ? busqueda.res : null;
  const buscando = !corta && resultados === null;

  /**
   * La búsqueda se dispara sola cuando el texto deja de cambiar.
   *
   * Antes salía una consulta por tecla: escribir "detectives salvajes" eran
   * diecinueve búsquedas contra una API que tarda más de un segundo. Ahora se
   * espera a que pares de escribir, y si igual queda una en vuelo cuando
   * empezás de nuevo, se aborta.
   */
  useEffect(() => {
    if (corta) return;

    const control = new AbortController();
    const timer = setTimeout(async () => {
      const res = await searchBooks(q, control.signal);
      if (control.signal.aborted) return;
      setBusqueda({ q, res });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      control.abort();
    };
  }, [q, corta]);

  async function agregar(input: Parameters<typeof addBook>[0]) {
    setError(null);
    setQuery("");
    inputRef.current?.focus();
    const res = await addBook(input);
    if (res?.error) setError(res.error);
  }

  const { container, start } = useReorder({
    onStart: setArrastrando,
    onEnd: (ids) => {
      // Sincrónico: el hook limpia los desplazamientos apenas vuelve, y para
      // entonces el DOM ya tiene que estar en el orden nuevo.
      flushSync(() => {
        setArrastrando(null);
        if (ids) {
          const porId = new Map(ordenados.map((b) => [b.id, b]));
          setOrdenLocal(ids.flatMap((id) => porId.get(id) ?? []));
        }
      });
      // Se guarda el orden que quedó a la vista.
      if (ids) void reorderBooks(ids);
    },
  });

  const yaEsta = (titulo: string) =>
    shown.some((b) => norm(b.title) === norm(titulo));

  const buscandoAlgo = q.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "bg-sand flex h-touch items-center gap-2 rounded-full px-4",
          "transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1.5px_var(--accent)]",
        )}
      >
        <MagnifyingGlassIcon size={19} className="text-accent shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un libro para agregar"
          aria-label="Buscar un libro para agregar"
          autoComplete="off"
          maxLength={300}
          className="text-body placeholder:text-ink-faint min-w-0 flex-1 bg-transparent focus:outline-none"
        />
        {buscandoAlgo && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Limpiar búsqueda"
            className="text-ink-faint hover:text-ink-soft -mr-1 shrink-0 animate-[pop_0.25s_var(--ease-out-kit)_both] transition-colors"
          >
            <XCircleIcon size={20} weight="fill" />
          </button>
        )}
      </div>

      <Reveal when={error} className="[--presence-gap:1rem]">
        {(mensaje) => (
          <p role="alert" className="text-footnote text-danger px-1">
            {mensaje}
          </p>
        )}
      </Reveal>

      {/* Se le pasa todo lo que muestra, no solo "hay búsqueda": al elegir un
          resultado el campo se vacía, y así el bloque se va con los
          resultados puestos en vez de cambiar a "Escribí al menos tres
          letras" mientras se cierra. */}
      <Reveal
        when={buscandoAlgo ? { query, buscando, resultados } : null}
        className="[--presence-gap:1rem]"
      >
        {(b) => (
          <Resultados
            buscando={b.buscando}
            resultados={b.resultados}
            query={b.query}
            yaEsta={yaEsta}
            onElegir={(r) =>
              void agregar({
                title: r.title,
                author: r.author,
                year: r.year,
                coverUrl: r.coverUrl,
                olid: r.olid,
              })
            }
            onManual={() => void agregar({ title: query })}
          />
        )}
      </Reveal>

      {shown.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Biblioteca vacía"
          description="Buscá arriba el primer libro que quieras anotar. Te traigo el autor, el año y la portada."
        />
      ) : (
        <ListGroup footer="Mantené apretado para reordenar. Deslizá para editar o borrar.">
          <div ref={container}>
            <PresenceList items={ordenados} getKey={(book) => book.id}>
              {(book, { last }) => (
                <Ficha
                  book={book}
                  last={last}
                  arrastrando={arrastrando === book.id}
                  onPresion={(y) => start(book.id, y)}
                  onEdit={() => setEditando(book)}
                  onDelete={() =>
                    run({ type: "delete", id: book.id }, () => deleteBook(book.id))
                  }
                />
              )}
            </PresenceList>
          </div>
        </ListGroup>
      )}

      <BookEditor
        book={editando}
        onOpenChange={(open) => !open && setEditando(null)}
        onSave={(draft) => {
          const libro = editando;
          if (!libro) return;
          setError(null);
          run({ type: "save", id: libro.id, draft }, () =>
            updateBook(libro.id, draft),
          );
        }}
      />
    </div>
  );
}

/**
 * Fila de libro.
 *
 * Conviven dos gestos sobre la misma fila y se distinguen por intención:
 * moverse en horizontal enseguida es un swipe -editar o borrar-, y mantener
 * apretado sin moverse arranca el arrastre para reordenar. Mientras se
 * reordena, el swipe queda apagado para que no peleen por el mismo dedo.
 */
function Ficha({
  book,
  last,
  arrastrando,
  onPresion,
  onEdit,
  onDelete,
}: {
  book: Book;
  last: boolean;
  arrastrando: boolean;
  /** Se sostuvo el dedo sin moverse: arranca el arrastre desde esa altura. */
  onPresion: (clientY: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const esAudio = book.format === "audiolibro";
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef({ x: 0, y: 0 });

  const cancelarPresion = () => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  return (
    // El arrastre no lo dispara el primer movimiento: lo dispara la presión
    // sostenida, para no robarle el gesto horizontal al swipe.
    <div
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        inicio.current = { x: e.clientX, y: e.clientY };
        const y = e.clientY;
        temporizador.current = setTimeout(() => {
          temporizador.current = null;
          onPresion(y);
        }, PRESION_MS);
      }}
      onPointerMove={(e) => {
        if (!temporizador.current) return;
        // Si el dedo se fue antes de tiempo, era un swipe o un scroll.
        if (
          Math.abs(e.clientX - inicio.current.x) > SLOP_PX ||
          Math.abs(e.clientY - inicio.current.y) > SLOP_PX
        )
          cancelarPresion();
      }}
      onPointerUp={cancelarPresion}
      onPointerCancel={cancelarPresion}
      // Mantener apretado en el teléfono abre el menú contextual del sistema.
      onContextMenu={(e) => e.preventDefault()}
    >
      <SwipeRow
        disabled={arrastrando}
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
            "bg-card flex gap-3 px-4 py-3",
            !last && !arrastrando && "hairline-b",
            "[--hairline-inset:4.25rem]",
            "transition-colors duration-200",
            arrastrando && "bg-sand cursor-grabbing select-none",
          )}
        >
          <Portada url={book.cover_url} titulo={book.title} ancho={44} />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="min-w-0">
              <h3 className="text-body line-clamp-1 font-semibold">{book.title}</h3>
              <p className="text-micro text-ink-faint truncate">
                {[book.author, book.year, book.read_year ? `leído en ${book.read_year}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <Tag variant={book.status === "leyendo" ? "accent" : "wash"}>
                {ETIQUETA[book.status]}
              </Tag>
              <Tag variant="wash">{esAudio ? "Audio" : "Libro"}</Tag>

              {book.rating !== null && (
                <StarRating value={book.rating} readOnly size={14} className="ml-auto" />
              )}
            </div>
          </div>
        </article>
      </SwipeRow>
    </div>
  );
}

function Resultados({
  buscando,
  resultados,
  query,
  yaEsta,
  onElegir,
  onManual,
}: {
  buscando: boolean;
  resultados: BookResult[] | null;
  query: string;
  yaEsta: (t: string) => boolean;
  onElegir: (r: BookResult) => void;
  onManual: () => void;
}) {
  const corta = query.trim().length < 3;

  return (
    <div className="bg-card border-line flex flex-col overflow-hidden rounded-lg border">
      {corta ? (
        <p className="text-footnote text-ink-soft px-4 py-3">
          Escribí al menos tres letras.
        </p>
      ) : buscando ? (
        <p className="text-footnote text-ink-soft px-4 py-3">Buscando…</p>
      ) : (
        <>
          {(resultados ?? []).map((r, i) => {
            const repetido = yaEsta(r.title);
            return (
              <button
                key={r.olid}
                type="button"
                disabled={repetido}
                onClick={() => onElegir(r)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left",
                  i < (resultados?.length ?? 0) - 1 && "hairline-b",
                  "[--hairline-inset:4.25rem]",
                  repetido
                    ? "opacity-50"
                    : "hover:bg-card-sunken/60 active:bg-card-sunken transition-colors",
                )}
              >
                <Portada url={r.coverUrl} titulo={r.title} ancho={36} />
                <span className="min-w-0 flex-1">
                  <span className="text-subhead block truncate">{r.title}</span>
                  <span className="text-footnote text-ink-soft block truncate">
                    {[r.author, r.year].filter(Boolean).join(" · ") || "Sin datos"}
                  </span>
                </span>
                {repetido ? (
                  <span className="text-micro text-ink-faint shrink-0">Ya está</span>
                ) : (
                  <PlusIcon size={18} className="text-accent shrink-0" />
                )}
              </button>
            );
          })}

          {/* Plan B: si Open Library no devuelve nada -o está caída- el libro se
              carga igual, solo con el título. Nunca queda bloqueado. */}
          <button
            type="button"
            onClick={onManual}
            className="hover:bg-card-sunken/60 active:bg-card-sunken flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
          >
            <span className="bg-accent-wash text-accent grid size-9 shrink-0 place-items-center rounded-full">
              <PlusIcon size={18} />
            </span>
            <span className="text-subhead min-w-0 flex-1 truncate">
              {resultados?.length
                ? "Ninguno es el mío, agregar a mano"
                : `Agregar “${query.trim()}” a mano`}
            </span>
          </button>
        </>
      )}
    </div>
  );
}

function Portada({
  url,
  titulo,
  ancho,
}: {
  url: string | null;
  titulo: string;
  ancho: number;
}) {
  const alto = Math.round(ancho * 1.5);

  if (!url) {
    return (
      // El hueco de la portada ocupa el lugar exacto de una tapa, así que es
      // rectangular y no va adentro de un IconChip. Lleva el acento igual: el
      // libro pertenece al módulo aunque falte la foto.
      <div
        className="bg-accent-chip text-accent grid shrink-0 place-items-center rounded-xs"
        style={{ width: ancho, height: alto }}
        aria-hidden
      >
        <BookOpenIcon size={Math.round(ancho / 2.4)} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ver comentario abajo
    <img
      src={url}
      alt={`Portada de ${titulo}`}
      loading="lazy"
      // La URL de la portada la puede pegar cualquiera y apunta a donde sea.
      // Sin esto, ese host se entera de qué pantalla de hubby la pidió.
      referrerPolicy="no-referrer"
      width={ancho}
      height={alto}
      // <img> y no next/image: ya iba unoptimized, así que no había nada que
      // optimizar, y next/image solo permite dominios declarados de antemano.
      // Ahora la portada puede venir de donde sea, incluida una URL pegada a
      // mano en el editor.
      className="bg-accent-wash shrink-0 rounded-xs object-cover"
      style={{ width: ancho, height: alto }}
    />
  );
}
