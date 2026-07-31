"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * Alerta con campo de texto, con la anatomía de las de iOS: tarjeta angosta y
 * centrada, título y mensaje al medio, y dos acciones abajo separadas por
 * hairlines —cancelar a la izquierda, la afirmativa en negrita a la derecha.
 */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  initialValue = "",
  confirmLabel = "Guardar",
  placeholder,
  maxLength,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialValue?: string;
  confirmLabel?: string;
  placeholder?: string;
  maxLength?: number;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  // El diálogo se reusa para distintos productos: hay que resembrar el campo
  // cada vez que se abre, no solo al montarse.
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const clean = value.trim();
  const disabled = clean.length === 0 || clean === initialValue.trim();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[270px] -translate-x-1/2 -translate-y-1/2",
            "bg-card/95 overflow-hidden rounded-[14px] backdrop-blur-xl",
            "shadow-[0_10px_40px_rgb(0_0_0/0.2)]",
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (disabled) return;
              onConfirm(clean);
              onOpenChange(false);
            }}
          >
            <div className="flex flex-col gap-1 px-4 pt-5 pb-4 text-center">
              <Dialog.Title className="text-headline">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-footnote text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                autoFocus
                aria-label={title}
                className={cn(
                  "bg-background border-separator mt-2 h-8 w-full rounded-[6px] border px-2",
                  "text-subhead focus:border-primary focus:outline-none",
                )}
              />
            </div>

            <div className="border-separator grid grid-cols-2 border-t">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-body text-primary border-separator h-11 border-r active:bg-fill-tertiary"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={disabled}
                className="text-body text-primary h-11 font-semibold active:bg-fill-tertiary disabled:opacity-40"
              >
                {confirmLabel}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
