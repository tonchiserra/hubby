"use client";

import { useRef } from "react";
import { BookOpenIcon } from "@/components/ui/icons";
import { StarRating } from "@/components/ui/star-rating";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import type { Book, BookStatus } from "@/lib/supabase/types";

/** Cuánto hay que mantener apretado antes de que arranque el arrastre. */
const PRESION_MS = 400;
/** Movimiento que descarta el arrastre: eso es un scroll. */
const SLOP_PX = 8;

const ETIQUETA: Record<BookStatus, string> = {
  leyendo: "En progreso",
  quiero: "No leído",
  leido: "Leído",
};

/**
 * Tarjeta de la grilla: la tapa grande y los datos abajo.
 *
 * Toda la tarjeta es un solo botón que abre el editor. Va encima del
 * contenido y no envolviéndolo, porque un <button> solo admite contenido de
 * frase y la tarjeta lleva bloques (las estrellas, por ejemplo).
 *
 * Tocar edita; mantener apretado sin moverse arranca el arrastre. Si el dedo
 * se mueve antes de tiempo era un scroll y no pasa nada.
 */
export function BookCard({
  book,
  arrastrable,
  arrastrando,
  onPresion,
  onOpen,
}: {
  book: Book;
  /** Solo en "Mi orden": con otro orden, mover a mano no significaría nada. */
  arrastrable: boolean;
  arrastrando: boolean;
  /** Se sostuvo el dedo sin moverse: arranca el arrastre desde ese punto. */
  onPresion: (punto: { x: number; y: number }) => void;
  onOpen: () => void;
}) {
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef({ x: 0, y: 0 });
  // El dedo que suelta un arrastre también dispara el click: sin esto, mover
  // un libro abriría su editor.
  const arrastro = useRef(false);

  const cancelarPresion = () => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg select-none",
        "transition-[background-color,box-shadow] duration-200",
        arrastrando && "bg-card shadow-lift",
      )}
    >
      <div
        className={cn(
          "shadow-cover relative overflow-hidden rounded-md",
          "transition-[translate,scale] duration-300 ease-out",
          "group-hover:-translate-y-1 group-has-[button:active]:scale-[0.98]",
        )}
      >
        <Portada url={book.cover_url} titulo={book.title} />
      </div>

      <div className="flex min-w-0 flex-col gap-2 px-0.5">
        <div className="min-w-0">
          <h3 className="text-subhead line-clamp-2 font-semibold">{book.title}</h3>
          {book.author && (
            <p className="text-footnote text-ink-soft mt-0.5 truncate">{book.author}</p>
          )}
          {book.read_year && (
            <p className="text-micro text-ink-faint mt-0.5">Leído en {book.read_year}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Tag variant={book.status === "leyendo" ? "accent" : "wash"}>
            {ETIQUETA[book.status]}
          </Tag>
          <Tag variant="wash">{book.format === "audiolibro" ? "Audio" : "Libro"}</Tag>
        </div>

        {book.rating !== null && <StarRating value={book.rating} readOnly size={14} />}
      </div>

      <button
        type="button"
        aria-label={`Editar ${book.title}`}
        className={cn(
          "absolute inset-0 rounded-lg [-webkit-touch-callout:none]",
          arrastrando ? "cursor-grabbing" : arrastrable && "active:cursor-grabbing",
        )}
        onClick={(e) => {
          // `detail` es 0 cuando el click viene del teclado: ese nunca arrastró.
          if (arrastro.current && e.detail !== 0) {
            arrastro.current = false;
            return;
          }
          onOpen();
        }}
        onPointerDown={(e) => {
          arrastro.current = false;
          if (!arrastrable) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          const punto = { x: e.clientX, y: e.clientY };
          inicio.current = punto;
          temporizador.current = setTimeout(() => {
            temporizador.current = null;
            arrastro.current = true;
            onPresion(punto);
          }, PRESION_MS);
        }}
        onPointerMove={(e) => {
          if (!temporizador.current) return;
          if (
            Math.abs(e.clientX - inicio.current.x) > SLOP_PX ||
            Math.abs(e.clientY - inicio.current.y) > SLOP_PX
          )
            cancelarPresion();
        }}
        onPointerUp={cancelarPresion}
        onPointerCancel={cancelarPresion}
        // Mantener apretado en el teléfono abre el menú contextual del sistema.
        onContextMenu={(e) => arrastrable && e.preventDefault()}
      />
    </article>
  );
}

/**
 * La tapa. Sin `ancho` llena su contenedor en 2:3 (la grilla); con `ancho`
 * es una miniatura fija (los resultados de la búsqueda).
 */
export function Portada({
  url,
  titulo,
  ancho,
}: {
  url: string | null;
  titulo: string;
  ancho?: number;
}) {
  const fija = ancho !== undefined;
  const alto = fija ? Math.round(ancho * 1.5) : undefined;
  const tamano = fija ? { width: ancho, height: alto } : undefined;

  if (!url) {
    return (
      // El hueco de la portada ocupa el lugar exacto de una tapa, así que es
      // rectangular y no va adentro de un IconChip. Lleva el acento igual: el
      // libro pertenece al módulo aunque falte la foto. En la grilla repite
      // el título, como una tapa lisa: un rectángulo con un ícono solo se
      // leería como un hueco.
      <div
        className={cn(
          "bg-accent-chip text-accent grid shrink-0 place-items-center",
          fija ? "rounded-xs" : "aspect-[2/3] w-full content-center gap-3 px-4 text-center",
        )}
        style={tamano}
        aria-hidden
      >
        <BookOpenIcon size={fija ? Math.round(ancho / 2.4) : 28} />
        {!fija && (
          <span className="display-tight text-footnote line-clamp-4 font-semibold text-balance">
            {titulo}
          </span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ver comentario abajo
    <img
      src={url}
      alt={`Portada de ${titulo}`}
      loading="lazy"
      draggable={false}
      // La URL de la portada la puede pegar cualquiera y apunta a donde sea.
      // Sin esto, ese host se entera de qué pantalla de hubby la pidió.
      referrerPolicy="no-referrer"
      width={ancho ?? 200}
      height={alto ?? 300}
      // <img> y no next/image: ya iba unoptimized, así que no había nada que
      // optimizar, y next/image solo permite dominios declarados de antemano.
      // Ahora la portada puede venir de donde sea, incluida una URL pegada a
      // mano en el editor.
      className={cn(
        "bg-accent-wash shrink-0 object-cover",
        fija ? "rounded-xs" : "aspect-[2/3] w-full",
      )}
      style={tamano}
    />
  );
}
