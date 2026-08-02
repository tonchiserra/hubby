"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import type { Wish, WishStatus } from "@/lib/supabase/types";
import { parsePrice, sanitizePriceInput } from "./money";

export type WishDraft = {
  title: string;
  price: number | null;
  url: string | null;
  status: WishStatus;
};

/**
 * Editor del deseo. Es el único lugar donde se cargan precio y link: en la
 * lista esos datos son de lectura, así que recorrerla no puede modificar nada
 * por accidente.
 */
export function WishEditor({
  wish,
  onOpenChange,
  onSave,
}: {
  wish: Wish | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: WishDraft) => void;
}) {
  return (
    <Dialog.Root open={wish !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[min(22rem,calc(100vw-2rem))]",
            "-translate-x-1/2 -translate-y-1/2",
            "bg-card overflow-hidden rounded-lg shadow-float",
          )}
        >
          {/* El formulario se remonta por deseo, con `key`: así los campos
              nacen ya sembrados en vez de sincronizarse con un efecto. */}
          {wish && (
            <Formulario
              key={wish.id}
              wish={wish}
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
  wish,
  onCancel,
  onSave,
}: {
  wish: Wish;
  onCancel: () => void;
  onSave: (draft: WishDraft) => void;
}) {
  const [title, setTitle] = useState(wish.title);
  // Se siembra con coma decimal porque es lo que el campo acepta: mostrar
  // "1299.99" y que la primera tecla no pueda reproducirlo sería inconsistente.
  const [price, setPrice] = useState(
    wish.price === null ? "" : String(wish.price).replace(".", ","),
  );
  const [url, setUrl] = useState(wish.url ?? "");
  const [status, setStatus] = useState<WishStatus>(wish.status);

  const limpio = title.trim();
  const link = url.trim();
  const linkValido = link === "" || /^https?:\/\//i.test(link);
  // Una coma suelta -"1299," a medio escribir- todavía no es un número.
  const precioValido = price === "" || parsePrice(price) !== null;

  const puedeGuardar = Boolean(limpio) && linkValido && precioValido;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!puedeGuardar) return;
        onSave({
          title: limpio,
          price: parsePrice(price),
          url: link || null,
          status,
        });
      }}
    >
      <div className="flex flex-col gap-4 px-4 pt-4 pb-5">
        <Dialog.Title className="text-headline text-center">
          Editar deseo
        </Dialog.Title>

        <Campo etiqueta="Qué es">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            autoFocus
            aria-label="Qué es"
            className="bg-sand text-body text-ink h-10 w-full rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-accent/35"
          />
        </Campo>

        <Campo etiqueta="Precio">
          <div className="flex items-center gap-2">
            <span className="text-body text-ink-soft" aria-hidden>
              $
            </span>
            <input
              value={price}
              // Se filtra en cada tecla: así el valor guardado nunca depende de
              // adivinar si un punto era separador de miles o de decimales.
              onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
              inputMode="decimal"
              placeholder="Sin precio"
              aria-label="Precio"
              className={cn(
                "bg-sand text-body text-ink placeholder:text-ink-faint h-10 min-w-0 flex-1 rounded-md px-3 tabular-nums",
                "focus:outline-none focus:ring-2 focus:ring-accent/35",
                !precioValido && "ring-2 ring-danger",
              )}
            />
          </div>
        </Campo>

        <Campo etiqueta="Dónde comprarlo">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            maxLength={2000}
            aria-label="Link de compra"
            className={cn(
              "bg-sand text-footnote text-ink placeholder:text-ink-faint h-10 w-full rounded-md px-3",
              "focus:outline-none focus:ring-2 focus:ring-accent/35",
              !linkValido && "ring-2 ring-danger",
            )}
          />
        </Campo>

        <Campo etiqueta="Estado">
          <Segmented
            name={`estado-${wish.id}`}
            value={status}
            onChange={setStatus}
            segments={[
              { value: "quiero", label: "Algún día" },
              { value: "proximo", label: "Próximo" },
              { value: "comprado", label: "Comprado" },
            ]}
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
          disabled={!puedeGuardar}
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
