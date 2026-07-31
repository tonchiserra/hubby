"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";

type PromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initialValue?: string;
  confirmLabel?: string;
  placeholder?: string;
  maxLength?: number;
  onConfirm: (value: string) => void;
};

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
}: PromptDialogProps) {
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
          {/*
            El estado del campo vive en un componente aparte, montado solo
            mientras el diálogo está abierto y con `key` en el valor inicial.

            Así el campo nace ya sembrado en vez de sincronizarse después con un
            efecto. Resembrar con setState dentro de un efecto provoca un render
            en cascada: el diálogo se pinta una vez con el valor viejo y otra con
            el nuevo.
          */}
          <PromptForm
            key={initialValue}
            title={title}
            description={description}
            initialValue={initialValue}
            confirmLabel={confirmLabel}
            placeholder={placeholder}
            maxLength={maxLength}
            onConfirm={onConfirm}
            onClose={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PromptForm({
  title,
  description,
  initialValue,
  confirmLabel,
  placeholder,
  maxLength,
  onConfirm,
  onClose,
}: Omit<PromptDialogProps, "open" | "onOpenChange"> & {
  initialValue: string;
  confirmLabel: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  const clean = value.trim();
  const disabled = clean.length === 0 || clean === initialValue.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        onConfirm(clean);
        onClose();
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
  );
}
