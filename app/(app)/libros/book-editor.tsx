"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Segmented } from "@/components/ui/segmented";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";
import type { Book, BookFormat, BookStatus } from "@/lib/supabase/types";

export type BookDraft = {
  title: string;
  status: BookStatus;
  format: BookFormat;
  rating: number | null;
  readYear: number | null;
};

/**
 * Editor del libro. Es el único lugar donde se cambian estado, formato y
 * valoración: en la lista esos datos son de lectura, así que recorrerla no
 * puede modificar nada por accidente.
 */
export function BookEditor({
  book,
  onOpenChange,
  onSave,
}: {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: BookDraft) => void;
}) {
  return (
    <Dialog.Root open={book !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[min(22rem,calc(100vw-2rem))]",
            "-translate-x-1/2 -translate-y-1/2",
            "bg-card overflow-hidden rounded-lg shadow-float",
          )}
        >
          {/* El formulario se remonta por libro, con `key`: así los campos
              nacen ya sembrados en vez de sincronizarse con un efecto. */}
          {book && (
            <Formulario
              key={book.id}
              book={book}
              onCancel={() => onOpenChange(false)}
              onSave={(draft) => {
                onSave(draft);
                onOpenChange(false);
              }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Formulario({
  book,
  onCancel,
  onSave,
}: {
  book: Book;
  onCancel: () => void;
  onSave: (draft: BookDraft) => void;
}) {
  const [title, setTitle] = useState(book.title);
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [format, setFormat] = useState<BookFormat>(book.format);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [readYear, setReadYear] = useState<string>(
    book.read_year ? String(book.read_year) : "",
  );

  const limpio = title.trim();
  const anioValido =
    readYear === "" || /^\d{4}$/.test(readYear.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!limpio || !anioValido) return;
        onSave({
          title: limpio,
          status,
          format,
          rating,
          readYear: readYear.trim() ? Number(readYear.trim()) : null,
        });
      }}
    >
      <div className="flex flex-col gap-4 px-4 pt-4 pb-5">
        <Dialog.Title className="text-headline text-center">
          Editar libro
        </Dialog.Title>

        <Campo etiqueta="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            autoFocus
            aria-label="Título"
            className="bg-sand text-body text-ink h-10 w-full rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-accent/35"
          />
        </Campo>

        <Campo etiqueta="Estado">
          <Segmented
            name={`estado-${book.id}`}
            value={status}
            onChange={setStatus}
            segments={[
              { value: "quiero", label: "No leído" },
              { value: "leyendo", label: "En progreso" },
              { value: "leido", label: "Leído" },
            ]}
          />
        </Campo>

        <Campo etiqueta="Formato">
          <Segmented
            name={`formato-${book.id}`}
            value={format}
            onChange={setFormat}
            segments={[
              { value: "libro", label: "Libro" },
              { value: "audiolibro", label: "Audiolibro" },
            ]}
          />
        </Campo>

        <Campo etiqueta="Valoración">
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} size={22} />
            {rating !== null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-footnote text-ink-soft hover:text-ink"
              >
                Quitar
              </button>
            )}
          </div>
        </Campo>

        {/* El año se puede cargar en cualquier estado: podés estar leyendo
            algo que empezaste el año pasado, o anotar cuándo leíste algo que
            todavía no marcaste como terminado. */}
        <Campo etiqueta="Año">
            <input
              value={readYear}
              onChange={(e) => setReadYear(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={4}
              placeholder={String(new Date().getFullYear())}
              aria-label="Año de lectura"
              className={cn(
                "bg-sand text-body text-ink h-10 w-24 rounded-md px-3 tabular-nums",
                "focus:outline-none focus:ring-2 focus:ring-accent/35",
                !anioValido && "ring-2 ring-danger",
              )}
            />
        </Campo>
      </div>

      <div className="border-line grid grid-cols-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="text-body text-ink-soft border-line h-12 border-r active:bg-card-sunken"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!limpio || !anioValido}
          className="text-body text-accent h-12 font-semibold active:bg-card-sunken disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-micro text-ink-soft font-medium tracking-wide uppercase">
        {etiqueta}
      </span>
      {children}
    </label>
  );
}
