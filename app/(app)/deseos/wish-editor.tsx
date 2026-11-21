"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Sheet, SheetActions } from "@/components/ui/sheet";
import { Segmented } from "@/components/ui/segmented";
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
  // La hoja se queda con el último deseo mientras se cierra: así se va con
  // el formulario puesto en vez de vaciarse antes de terminar de bajar.
  const [ultimo, setUltimo] = useState(wish);
  if (wish && wish !== ultimo) setUltimo(wish);

  return (
    <Sheet open={wish !== null} onOpenChange={onOpenChange} title="Editar deseo">
      {/* El formulario se remonta por deseo, con `key`: así los campos nacen
          ya sembrados en vez de sincronizarse con un efecto. */}
      {ultimo && (
        <Formulario
          key={ultimo.id}
          wish={ultimo}
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
      <div className="flex flex-col gap-5">
        <Field label="Qué es" htmlFor="deseo-titulo">
          <input
            id="deseo-titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            data-autofocus
            className="field"
          />
        </Field>

        <Field label="Precio" htmlFor="deseo-precio">
          <div className="flex items-center gap-2">
            <span className="text-body text-ink-soft" aria-hidden>
              $
            </span>
            <input
              id="deseo-precio"
              value={price}
              // Se filtra en cada tecla: así el valor guardado nunca depende de
              // adivinar si un punto era separador de miles o de decimales.
              onChange={(e) => setPrice(sanitizePriceInput(e.target.value))}
              inputMode="decimal"
              placeholder="Sin precio"
              aria-invalid={!precioValido || undefined}
              className="field cifra min-w-0 flex-1"
            />
          </div>
        </Field>

        <Field label="Dónde comprarlo" htmlFor="deseo-link">
          <input
            id="deseo-link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            maxLength={2000}
            aria-invalid={!linkValido || undefined}
            className="field text-subhead"
          />
        </Field>

        <Field label="Estado">
          <Segmented
            name={`estado-${wish.id}`}
            label="Estado"
            value={status}
            onChange={setStatus}
            segments={[
              { value: "quiero", label: "Algún día" },
              { value: "proximo", label: "Próximo" },
              { value: "comprado", label: "Comprado" },
            ]}
          />
        </Field>
      </div>

      <SheetActions>
        <Button type="button" variant="soft" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!puedeGuardar}>
          Guardar
        </Button>
      </SheetActions>
    </form>
  );
}
