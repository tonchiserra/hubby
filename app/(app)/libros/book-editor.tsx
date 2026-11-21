"use client";

import { useState } from "react";
import { BookOpenIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Field, Sheet, SheetActions } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
import { StarRating } from "@/components/ui/star-rating";
import type { Book, BookFormat, BookStatus } from "@/lib/supabase/types";

export type BookDraft = {
  title: string;
  author: string | null;
  coverUrl: string | null;
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
  // La hoja se queda con el último libro mientras se cierra: así se va con el
  // formulario puesto en vez de vaciarse antes de terminar de bajar.
  const [ultimo, setUltimo] = useState(book);
  if (book && book !== ultimo) setUltimo(book);

  return (
    <Sheet open={book !== null} onOpenChange={onOpenChange} title="Editar libro">
      {/* El formulario se remonta por libro, con `key`: así los campos nacen
          ya sembrados en vez de sincronizarse con un efecto. */}
      {ultimo && (
        <Formulario
          key={ultimo.id}
          book={ultimo}
          onCancel={() => onOpenChange(false)}
          onSave={(draft) => {
            onSave(draft);
            onOpenChange(false);
          }}
        />
      )}
    </Sheet>
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
  const [author, setAuthor] = useState(book.author ?? "");
  const [coverUrl, setCoverUrl] = useState(book.cover_url ?? "");
  const [status, setStatus] = useState<BookStatus>(book.status);
  const [format, setFormat] = useState<BookFormat>(book.format);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [readYear, setReadYear] = useState<string>(
    book.read_year ? String(book.read_year) : "",
  );

  const limpio = title.trim();
  const anioValido = readYear === "" || /^\d{4}$/.test(readYear.trim());
  const portada = coverUrl.trim();
  const portadaValida = portada === "" || /^https?:\/\//i.test(portada);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!limpio || !anioValido || !portadaValida) return;
        onSave({
          title: limpio,
          author: author.trim() || null,
          coverUrl: coverUrl.trim() || null,
          status,
          format,
          rating,
          readYear: readYear.trim() ? Number(readYear.trim()) : null,
        });
      }}
    >
      <div className="flex flex-col gap-5">
        <Field label="Título" htmlFor="libro-titulo">
          <input
            id="libro-titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            data-autofocus
            className="field"
          />
        </Field>

        <Field label="Autor" htmlFor="libro-autor">
          <input
            id="libro-autor"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={200}
            placeholder="Sin autor"
            className="field"
          />
        </Field>

        <Field label="Portada" htmlFor="libro-portada">
          <div className="flex items-end gap-3">
            {/* Vista previa en vivo: pegás la dirección y ves si es la correcta
                antes de guardar. */}
            {portada && portadaValida ? (
              // La portada puede venir de cualquier dominio, y next/image
              // solo permite los declarados de antemano.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada}
                alt=""
                // Ídem la lista: el host de la portada no tiene por qué saber
                // desde dónde se lo llamó.
                referrerPolicy="no-referrer"
                className="bg-sand h-[54px] w-9 shrink-0 rounded-xs object-cover"
              />
            ) : (
              // El hueco de la portada ocupa el lugar exacto de una tapa, así
              // que es rectangular y no va adentro de un IconChip. Lleva el
              // acento igual: el libro pertenece al módulo aunque falte la foto.
              <div className="bg-accent-chip grid h-[54px] w-9 shrink-0 place-items-center rounded-xs">
                <BookOpenIcon size={16} className="text-accent" />
              </div>
            )}
            <input
              id="libro-portada"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
              aria-invalid={!portadaValida || undefined}
              className="field text-subhead min-w-0 flex-1"
            />
          </div>
        </Field>

        <Field label="Estado">
          <Segmented
            name={`estado-${book.id}`}
            label="Estado"
            value={status}
            onChange={setStatus}
            segments={[
              { value: "quiero", label: "No leído" },
              { value: "leyendo", label: "En progreso" },
              { value: "leido", label: "Leído" },
            ]}
          />
        </Field>

        <Field label="Formato">
          <Segmented
            name={`formato-${book.id}`}
            label="Formato"
            value={format}
            onChange={setFormat}
            segments={[
              { value: "libro", label: "Libro" },
              { value: "audiolibro", label: "Audiolibro" },
            ]}
          />
        </Field>

        <Field label="Valoración">
          <div className="flex h-11 items-center gap-3">
            <StarRating value={rating} onChange={setRating} size={24} />
            {rating !== null && (
              <button
                type="button"
                onClick={() => setRating(null)}
                className="text-footnote text-ink-soft hover:text-ink transition-colors"
              >
                Quitar
              </button>
            )}
          </div>
        </Field>

        {/* El año se puede cargar en cualquier estado: podés estar leyendo
            algo que empezaste el año pasado, o anotar cuándo leíste algo que
            todavía no marcaste como terminado. */}
        <Field label="Año" htmlFor="libro-anio">
          <input
            id="libro-anio"
            value={readYear}
            onChange={(e) => setReadYear(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={4}
            placeholder={String(new Date().getFullYear())}
            aria-invalid={!anioValido || undefined}
            className="field cifra w-24"
          />
        </Field>
      </div>

      <SheetActions>
        <Button type="button" variant="soft" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!limpio || !anioValido || !portadaValida}>
          Guardar
        </Button>
      </SheetActions>
    </form>
  );
}
