"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "@/components/ui/icons";

/**
 * Hoja sobre un <dialog> nativo con `showModal()`: abajo en el teléfono y
 * modal desde 760px, como en Platita. Reemplaza al Dialog de Radix.
 *
 * El navegador ya resuelve lo difícil: la capa superior (sin portal ni
 * z-index), el foco atrapado, Escape y el resto de la página inerte. La
 * entrada y la salida son CSS (`.sheet` en globals.css, con @starting-style).
 *
 * El contenido sigue montado hasta que termina la animación de cierre, así la
 * hoja se va con su formulario en vez de vaciarse primero.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  narrow,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  narrow?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal enfoca el primer control, que es la cruz de cerrar; un
      // formulario que pide su campo principal lo marca con data-autofocus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
      const t = window.setTimeout(() => setMounted(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const close = () => onOpenChange(false);

  return (
    <dialog
      ref={ref}
      className="sheet"
      data-narrow={narrow || undefined}
      aria-label={title}
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        // Un clic cuyo destino es el propio <dialog> cayó en el fondo.
        if (e.target === e.currentTarget) close();
      }}
    >
      {mounted && (
        <div className="flex max-h-[inherit] flex-col">
          <div
            className="sheet-grip bg-line-strong mx-auto mt-2 h-1 w-9 rounded-full"
            aria-hidden
          />
          <div className="sheet-head flex items-start justify-between gap-3 px-5 pt-4 pb-2">
            <div className="min-w-0">
              <h2 className="text-title3 display-tight">{title}</h2>
              {description && (
                <p className="text-footnote text-ink-soft mt-1">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="text-ink-soft hover:bg-sand hover:text-ink -mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>
          <div className="sheet-body overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Pie de una hoja con formulario: cancelar y la acción principal. */
export function SheetActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-6">{children}</div>;
}

/** Un campo con su rótulo arriba, como los formularios de Platita. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  // Un <div> y no un <label>: varios campos contienen un segmentado o las
  // estrellas, que ya traen sus propios <label> y <button>, y un label
  // adentro de otro es HTML inválido. Los inputs llevan su aria-label.
  return (
    <div className="flex flex-col gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-caption text-ink-soft font-medium tracking-[0.08em] uppercase">
          {label}
        </label>
      ) : (
        <span className="text-caption text-ink-soft font-medium tracking-[0.08em] uppercase">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
