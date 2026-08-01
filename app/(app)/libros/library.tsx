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
import { Segmented } from "@/components/ui/segmented";
import { StarRating } from "@/components/ui/star-rating";
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

const ESTADOS: { value: BookStatus; label: string }[] = [
  { value: "leyendo", label: "Leyendo" },
  { value: "quiero", label: "Quiero leer" },
  { value: "leido", label: "Leídos" },
];

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
  const [filtro, setFiltro] = useState<BookStatus>("leyendo");
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

  const conteos = useMemo(
    () => ({
      leyendo: shown.filter((b) => b.status === "leyendo").length,
      quiero: shown.filter((b) => b.status === "quiero").length,
      leido: shown.filter((b) => b.status === "leido").length,
    }),
    [shown],
  );

  const visibles = useMemo(
    () => shown.filter((b) => b.status === filtro),
    [shown, filtro],
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
        <MagnifyingGlassIcon size={18} weight="bold" className="text-accent shrink-0 opacity-70" />
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

      <Segmented
        name="filtro-libros"
        value={filtro}
        onChange={setFiltro}
        segments={ESTADOS.map((e) => ({ ...e, count: conteos[e.value] }))}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Biblioteca vacía"
          description="Buscá arriba el primer libro que quieras anotar. Te traigo el autor, el año y la portada."
        />
      ) : visibles.length === 0 ? (
        <p className="text-subhead text-ink-soft px-4 py-10 text-center">
          {filtro === "leyendo"
            ? "No estás leyendo nada ahora mismo."
            : filtro === "quiero"
              ? "No tenés nada anotado para leer."
              : "Todavía no terminaste ningún libro."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence initial={false}>
            {visibles.map((book) => (
              <motion.div
                key={book.id}
                layout
                variants={rowVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={springLayout}
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
  const siguiente: Record<BookStatus, { a: BookStatus; texto: string }> = {
    quiero: { a: "leyendo", texto: "Empezar" },
    leyendo: { a: "leido", texto: "Terminé" },
    leido: { a: "leyendo", texto: "Releer" },
  };
  const paso = siguiente[book.status];

  return (
    <div className="bg-card shadow-card flex h-full flex-col gap-2.5 rounded-lg p-3">
      <div className="relative">
        <Portada url={book.cover_url} titulo={book.title} ancho={null} />
        <button
          type="button"
          onClick={() => onFormat(book.format === "libro" ? "audiolibro" : "libro")}
          aria-label={
            book.format === "libro"
              ? "Cambiar a audiolibro"
              : "Cambiar a libro"
          }
          title={book.format === "libro" ? "Libro" : "Audiolibro"}
          className="bg-card/90 text-ink absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full backdrop-blur-sm transition-transform active:scale-90"
        >
          {book.format === "audiolibro" ? (
            <HeadphonesIcon size={14} weight="fill" />
          ) : (
            <BookOpenIcon size={14} weight="fill" />
          )}
        </button>
      </div>

      <div className="min-w-0">
        <p className="text-footnote line-clamp-2 font-semibold">{book.title}</p>
        {book.author && (
          <p className="text-micro text-ink-soft truncate">{book.author}</p>
        )}
      </div>

      <StarRating value={book.rating} onChange={onRating} size={15} />

      <div className="mt-auto flex items-center gap-1">
        <Button size="sm" variant="soft" className="flex-1" onClick={() => onStatus(paso.a)}>
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

      {book.status === "leido" && book.read_year && (
        <p className="text-micro text-ink-faint -mt-1">Leído en {book.read_year}</p>
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
  ancho: number | null;
}) {
  const clases = ancho
    ? "shrink-0 overflow-hidden rounded-sm"
    : "aspect-[2/3] w-full overflow-hidden rounded-md";

  if (!url) {
    return (
      <div
        className={cn(
          clases,
          "bg-accent-wash text-accent grid place-items-center",
        )}
        style={ancho ? { width: ancho, height: ancho * 1.5 } : undefined}
        aria-hidden
      >
        <BookOpenIcon size={ancho ? 14 : 26} />
      </div>
    );
  }

  return (
    <div
      className={cn(clases, "bg-accent-wash relative")}
      style={ancho ? { width: ancho, height: ancho * 1.5 } : undefined}
    >
      <Image
        src={url}
        alt={`Portada de ${titulo}`}
        fill
        sizes={ancho ? `${ancho}px` : "(max-width: 640px) 50vw, 33vw"}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
