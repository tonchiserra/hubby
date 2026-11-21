"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XCircleIcon,
} from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { SelectPill } from "@/components/ui/select-pill";
import { EmptyState } from "@/components/hubby/empty-state";
import { Reveal } from "@/components/hubby/presence";
import { PresenceGrid } from "@/components/hubby/presence-grid";
import { useReorder } from "@/components/hubby/use-reorder";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/supabase/types";
import { BookCard, Portada } from "./book-card";
import { BookEditor, type BookDraft } from "./book-editor";
import { addBook, deleteBook, reorderBooks, updateBook } from "./actions";
import {
  aniosDeLectura,
  cumpleValoracion,
  filtrarLibros,
  norm,
  ordenarLibros,
  reordenarSubconjunto,
  type FiltroValoracion,
  type Orden,
} from "./grid";
import { searchBooks, type BookResult } from "./open-library";

/** Lo que se espera a que dejes de escribir antes de consultar. */
const DEBOUNCE_MS = 400;

const ORDENES: { value: Orden; label: string }[] = [
  { value: "manual", label: "Mi orden" },
  { value: "recientes", label: "Recién agregados" },
  { value: "titulo", label: "Por título" },
  { value: "autor", label: "Por autor" },
  { value: "valoracion", label: "Mejor valorados" },
];

const VALORACIONES: { value: FiltroValoracion; label: string }[] = [
  { value: "todas", label: "Cualquier valoración" },
  { value: "5", label: "5 estrellas" },
  { value: "4", label: "Desde 4 estrellas" },
  { value: "3", label: "Desde 3 estrellas" },
  { value: "sin", label: "Sin valorar" },
];

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
  const [orden, setOrden] = useState<Orden>("manual");
  const [anio, setAnio] = useState<number | null>(null);
  const [valoracion, setValoracion] = useState<FiltroValoracion>("todas");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (patch: Patch, action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      addPatch(patch);
      const res = await action();
      if (res?.error) setError(res.error);
    });

  /**
   * Orden manual que se está viendo. Mientras arrastrás manda el local; cuando
   * cambia la composición de la biblioteca -agregaste o borraste- se vuelve al
   * del servidor. Se deduce en el render, sin efectos que sincronicen nada.
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

  const anios = useMemo(() => aniosDeLectura(shown), [shown]);
  // Si el año elegido dejó de existir -editaste el único libro de ese año-, el
  // filtro se cae solo en vez de dejarte en una grilla vacía sin opción.
  const anioActivo = anio !== null && anios.includes(anio) ? anio : null;
  const hayFiltros = anioActivo !== null || valoracion !== "todas";

  const visibles = useMemo(
    () =>
      ordenarLibros(
        filtrarLibros(ordenados, { anio: anioActivo, valoracion, texto: query }),
        orden,
      ),
    [ordenados, anioActivo, valoracion, query, orden],
  );

  // Cada contador cuenta con los demás filtros puestos: "2025 · 3" son los
  // tres de 2025 que cumplen la valoración elegida, no todos los de 2025.
  const porAnio = useMemo(() => {
    const base = filtrarLibros(shown, { anio: null, valoracion, texto: query });
    const cuenta = new Map<number, number>();
    base.forEach((b) => b.read_year !== null && cuenta.set(b.read_year, (cuenta.get(b.read_year) ?? 0) + 1));
    return cuenta;
  }, [shown, valoracion, query]);

  const porValoracion = useMemo(() => {
    const base = filtrarLibros(shown, { anio: anioActivo, valoracion: "todas", texto: query });
    return new Map(
      VALORACIONES.map((v) => [v.value, base.filter((b) => cumpleValoracion(b, v.value)).length]),
    );
  }, [shown, anioActivo, query]);

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
      // Con un filtro puesto se arrastró entre los visibles: el orden que se
      // guarda es el de la biblioteca entera, con los ocultos en su lugar.
      const completo = ids && reordenarSubconjunto(ordenados.map((b) => b.id), ids);
      // Sincrónico: el hook limpia los desplazamientos apenas vuelve, y para
      // entonces el DOM ya tiene que estar en el orden nuevo.
      flushSync(() => {
        setArrastrando(null);
        if (completo) {
          const porId = new Map(ordenados.map((b) => [b.id, b]));
          setOrdenLocal(completo.flatMap((id) => porId.get(id) ?? []));
        }
      });
      if (completo) {
        void reorderBooks(completo).then((res) => res?.error && setError(res.error));
      }
    },
  });

  const yaEsta = (titulo: string) =>
    shown.some((b) => norm(b.title) === norm(titulo));

  const buscandoAlgo = q.length > 0;
  const manual = orden === "manual";

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
          placeholder="Buscar en tu biblioteca o agregar"
          aria-label="Buscar en tu biblioteca o agregar un libro"
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
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SelectPill
              label="Ordenar"
              display={ORDENES.find((o) => o.value === orden)!.label}
              value={orden}
              options={ORDENES}
              onChange={setOrden}
            />
            {/* Sin años cargados el filtro tendría una sola opción. */}
            {anios.length > 0 && (
              <SelectPill
                label="Año de lectura"
                display={anioActivo === null ? "Año" : String(anioActivo)}
                value={anioActivo === null ? "todos" : String(anioActivo)}
                options={[
                  { value: "todos", label: "Todos los años" },
                  ...anios.map((a) => ({
                    value: String(a),
                    label: `${a} · ${porAnio.get(a) ?? 0}`,
                  })),
                ]}
                onChange={(v) => setAnio(v === "todos" ? null : Number(v))}
                active={anioActivo !== null}
              />
            )}
            <SelectPill
              label="Valoración"
              display={
                valoracion === "todas"
                  ? "Valoración"
                  : VALORACIONES.find((v) => v.value === valoracion)!.label
              }
              value={valoracion}
              options={VALORACIONES.map((v) =>
                v.value === "todas"
                  ? v
                  : { ...v, label: `${v.label} · ${porValoracion.get(v.value) ?? 0}` },
              )}
              onChange={setValoracion}
              active={valoracion !== "todas"}
            />
          </div>

          {/* En su propia línea y no al lado de las píldoras: ahí en el
              teléfono no entraba y quedaba solo en una segunda fila. */}
          <p className="eyebrow pt-1" aria-live="polite">
            {hayFiltros || buscandoAlgo
              ? `${visibles.length} de ${shown.length} libros`
              : `${shown.length} ${shown.length === 1 ? "libro" : "libros"}`}
          </p>

          <PresenceGrid
            ref={container}
            items={visibles}
            getKey={(book) => book.id}
            className="grid-cols-2 items-start gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4"
          >
            {(book) => (
              <BookCard
                book={book}
                arrastrable={manual}
                arrastrando={arrastrando === book.id}
                onPresion={(punto) => start(book.id, punto)}
                onOpen={() => setEditando(book)}
              />
            )}
          </PresenceGrid>

          <Reveal
            when={
              visibles.length === 0
                ? hayFiltros
                  ? { texto: "Ningún libro coincide con los filtros.", filtros: true }
                  : { texto: `No tenés ningún libro que coincida con “${q}”.`, filtros: false }
                : null
            }
          >
            {(vacio) => (
              <div className="bg-sand flex flex-col items-center gap-3 rounded-lg px-6 py-10 text-center">
                <p className="text-subhead text-ink-soft text-balance">{vacio.texto}</p>
                {vacio.filtros && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setAnio(null);
                      setValoracion("todas");
                    }}
                  >
                    Quitar filtros
                  </Button>
                )}
              </div>
            )}
          </Reveal>

          <Reveal when={visibles.length > 0 ? (manual ? "manual" : "otro") : null}>
            {(modo) => (
              <p className="text-footnote text-ink-faint pt-2 text-center text-balance">
                {modo === "manual"
                  ? "Tocá un libro para editarlo. Mantené apretado para moverlo."
                  : "Tocá un libro para editarlo. Para moverlos a mano, ordená por Mi orden."}
              </p>
            )}
          </Reveal>
        </>
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
        onDelete={() => {
          const libro = editando;
          if (!libro) return;
          setError(null);
          setEditando(null);
          run({ type: "delete", id: libro.id }, () => deleteBook(libro.id));
        }}
      />
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
