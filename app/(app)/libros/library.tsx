"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  BookOpenIcon,
  HeadphonesIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Tag, TagButton } from "@/components/ui/tag";
import { EmptyState } from "@/components/hubby/empty-state";
import { cn } from "@/lib/utils";
import { blockVariants, rowVariants, springEnter, springLayout } from "@/lib/motion";
import type { Book, BookStatus } from "@/lib/supabase/types";
import { addBook, deleteBook, setFormat, setRating, setStatus } from "./actions";
import { searchOpenLibrary } from "./search-action";
import type { BookResult } from "./open-library";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Sin filtros, el orden es lo único que jerarquiza: primero lo que estás
 * leyendo, después lo pendiente y al final lo terminado.
 */
const PESO: Record<BookStatus, number> = { leyendo: 0, quiero: 1, leido: 2 };

const ETIQUETA: Record<BookStatus, string> = {
  leyendo: "En progreso",
  quiero: "No leído",
  leido: "Leído",
};

/** Qué botón mostrar según dónde está el libro en su ciclo. */
const SIGUIENTE: Record<BookStatus, { a: BookStatus; texto: string }> = {
  quiero: { a: "leyendo", texto: "Empezar" },
  leyendo: { a: "leido", texto: "Terminé" },
  leido: { a: "leyendo", texto: "Releer" },
};

type Patch =
  | { type: "status"; id: string; status: BookStatus }
  | { type: "rating"; id: string; rating: number | null }
  | { type: "format"; id: string; format: Book["format"] }
  | { type: "delete"; id: string };

function apply(books: Book[], patch: Patch): Book[] {
  switch (patch.type) {
    case "status":
      return books.map((b) =>
        b.id === patch.id ? { ...b, status: patch.status } : b,
      );
    case "rating":
      return books.map((b) =>
        b.id === patch.id ? { ...b, rating: patch.rating } : b,
      );
    case "format":
      return books.map((b) =>
        b.id === patch.id ? { ...b, format: patch.format } : b,
      );
    case "delete":
      return books.filter((b) => b.id !== patch.id);
  }
}

export function Library({ books }: { books: Book[] }) {
  const [shown, addPatch] = useOptimistic(books, apply);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<BookResult[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Cada búsqueda lleva su número: si vuelve una vieja después de una nueva,
  // se descarta en vez de pisar resultados más recientes.
  const pedido = useRef(0);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  const ordenados = useMemo(
    () =>
      [...shown].sort(
        (a, b) =>
          PESO[a.status] - PESO[b.status] ||
          a.title.localeCompare(b.title, "es"),
      ),
    [shown],
  );

  async function buscar(q: string) {
    setQuery(q);
    const mio = ++pedido.current;

    if (q.trim().length < 3) {
      setResultados(null);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const res = await searchOpenLibrary(q);
    if (pedido.current !== mio) return; // llegó tarde
    setResultados(res);
    setBuscando(false);
  }

  async function agregar(input: Parameters<typeof addBook>[0]) {
    setError(null);
    setQuery("");
    setResultados(null);
    inputRef.current?.focus();
    const res = await addBook(input);
    if (res?.error) setError(res.error);
  }

  const yaEsta = (titulo: string) =>
    shown.some((b) => norm(b.title) === norm(titulo));

  const buscandoAlgo = query.trim().length > 0;

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
          onChange={(e) => void buscar(e.target.value)}
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
              setResultados(null);
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
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {ordenados.map((book) => (
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
                  onStatus={(status) =>
                    run({ type: "status", id: book.id, status }, () =>
                      setStatus(book.id, status),
                    )
                  }
                  onRating={(rating) =>
                    run({ type: "rating", id: book.id, rating }, () =>
                      setRating(book.id, rating),
                    )
                  }
                  onFormat={(format) =>
                    run({ type: "format", id: book.id, format }, () =>
                      setFormat(book.id, format),
                    )
                  }
                  onDelete={() =>
                    run({ type: "delete", id: book.id }, () => deleteBook(book.id))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Tarjeta horizontal: portada a la izquierda, todo lo demás a la derecha. */
function Ficha({
  book,
  onStatus,
  onRating,
  onFormat,
  onDelete,
}: {
  book: Book;
  onStatus: (s: BookStatus) => void;
  onRating: (r: number | null) => void;
  onFormat: (f: Book["format"]) => void;
  onDelete: () => void;
}) {
  const paso = SIGUIENTE[book.status];
  const esAudio = book.format === "audiolibro";

  return (
    <article className="bg-card shadow-card flex gap-3.5 rounded-lg p-3">
      <Portada url={book.cover_url} titulo={book.title} ancho={64} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          <h3 className="text-subhead line-clamp-2 font-semibold">{book.title}</h3>
          <p className="text-footnote text-ink-soft truncate">
            {[book.author, book.year].filter(Boolean).join(" · ") || "Sin datos"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* El estado en progreso reclama atención, así que lleva el acento
              lleno; los otros dos son informativos. */}
          <Tag variant={book.status === "leyendo" ? "accent" : "quiet"}>
            {ETIQUETA[book.status]}
          </Tag>

          {/* El formato es binario, así que la propia etiqueta lo alterna. */}
          <TagButton
            variant="wash"
            onClick={() => onFormat(esAudio ? "libro" : "audiolibro")}
            aria-label={esAudio ? "Cambiar a libro" : "Cambiar a audiolibro"}
          >
            {esAudio ? <HeadphonesIcon size={11} weight="fill" /> : <BookOpenIcon size={11} weight="fill" />}
            {esAudio ? "Audiolibro" : "Libro"}
          </TagButton>

          {book.status === "leido" && book.read_year && (
            <Tag variant="quiet">{book.read_year}</Tag>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <StarRating value={book.rating} onChange={onRating} size={15} />

          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="soft" onClick={() => onStatus(paso.a)}>
              {paso.texto}
            </Button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Borrar ${book.title}`}
              className="text-ink-faint hover:text-danger grid size-8 shrink-0 place-items-center rounded-full transition-colors active:scale-90"
            >
              <TrashIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
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
