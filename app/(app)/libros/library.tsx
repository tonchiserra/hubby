"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { StarRating } from "@/components/ui/star-rating";
import { Tag } from "@/components/ui/tag";
import { BookEditor, type BookDraft } from "./book-editor";
import { SwipeRow } from "@/components/hubby/swipe-row";
import { EmptyState } from "@/components/hubby/empty-state";
import { ListGroup } from "@/components/hubby/list";
import { cn } from "@/lib/utils";
import { blockVariants, rowVariants, springEnter, springLayout } from "@/lib/motion";
import type { Book, BookStatus } from "@/lib/supabase/types";
import { addBook, deleteBook, updateBook } from "./actions";
import { searchBooks, type BookResult } from "./open-library";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Orden: primero el año, del más reciente al más viejo; a igual año, lo editado
 * más recientemente. Los libros sin año van al final —no tienen fecha con la
 * cual competir— y entre ellos también manda la última edición.
 */
function comparar(a: Book, b: Book): number {
  const anioA = a.read_year ?? -Infinity;
  const anioB = b.read_year ?? -Infinity;
  if (anioA !== anioB) return anioB - anioA;
  return b.updated_at.localeCompare(a.updated_at);
}

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
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const ordenados = useMemo(() => [...shown].sort(comparar), [shown]);

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

  const yaEsta = (titulo: string) =>
    shown.some((b) => norm(b.title) === norm(titulo));

  const buscandoAlgo = q.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-sand flex h-touch items-center gap-2 rounded-lg px-3.5">
        <MagnifyingGlassIcon
          size={18}
          weight="bold"
          className="text-accent shrink-0 opacity-70"
        />
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
            className="text-ink-faint shrink-0"
          >
            <XCircleIcon size={20} weight="fill" />
          </button>
        )}
      </div>

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
            className="text-footnote text-danger overflow-hidden px-1"
          >
            {error}
          </motion.p>
        )}

        {buscandoAlgo && (
          <motion.div
            key="resultados"
            variants={blockVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springEnter}
            className="overflow-hidden"
          >
            <Resultados
              buscando={buscando}
              resultados={resultados}
              query={query}
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
          </motion.div>
        )}
      </AnimatePresence>

      {shown.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Biblioteca vacía"
          description="Buscá arriba el primer libro que quieras anotar. Te traigo el autor, el año y la portada."
        />
      ) : (
        <ListGroup footer="Deslizá un libro para editarlo o borrarlo.">
          <AnimatePresence initial={false}>
            {ordenados.map((book, i) => (
              <motion.div
                key={book.id}
                layout
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springLayout}
                className="overflow-hidden"
              >
                <Ficha
                  book={book}
                  last={i === ordenados.length - 1}
                  onEdit={() => setEditando(book)}
                  onDelete={() =>
                    run({ type: "delete", id: book.id }, () => deleteBook(book.id))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
 * Fila de libro. Misma anatomía que las del supermercado: todas dentro de una
 * sola tarjeta, separadas por hairlines indentados al texto, y con editar y
 * borrar por swipe.
 *
 * Todo lo que muestra es de solo lectura. Recorrer una lista no puede cambiar
 * datos por accidente: para eso está el editor, al que se llega deslizando.
 */
function Ficha({
  book,
  last,
  onEdit,
  onDelete,
}: {
  book: Book;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const esAudio = book.format === "audiolibro";

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
          "bg-card flex gap-3 px-4 py-3",
          !last && "hairline-b",
          "[--hairline-inset:4.25rem]",
        )}
      >
        <Portada url={book.cover_url} titulo={book.title} ancho={44} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="min-w-0">
            <h3 className="text-body line-clamp-1 font-medium">{book.title}</h3>
            <p className="text-micro text-ink-faint truncate">
              {/* El año se muestra siempre que exista, sin mirar el estado:
                  la lista se ordena por él, así que esconderlo dejaría un orden
                  sin explicación a la vista. */}
              {[book.author, book.year, book.read_year ? `leído en ${book.read_year}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {/* Solo el estado en progreso reclama atención. */}
            <Tag variant={book.status === "leyendo" ? "accent" : "quiet"}>
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
    <div className="bg-card shadow-card flex flex-col overflow-hidden rounded-lg">
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
                  <PlusIcon size={16} weight="bold" className="text-accent shrink-0" />
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
            <span className="bg-accent-wash text-accent grid size-9 shrink-0 place-items-center rounded-md">
              <PlusIcon size={16} weight="bold" />
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
      <div
        className="bg-accent-wash text-accent grid shrink-0 place-items-center rounded-md"
        style={{ width: ancho, height: alto }}
        aria-hidden
      >
        <BookOpenIcon size={Math.round(ancho / 2.4)} />
      </div>
    );
  }

  return (
    <div
      className="bg-accent-wash relative shrink-0 overflow-hidden rounded-md"
      style={{ width: ancho, height: alto }}
    >
      <Image
        src={url}
        alt={`Portada de ${titulo}`}
        fill
        sizes={`${ancho}px`}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
