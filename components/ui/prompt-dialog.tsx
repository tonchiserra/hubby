"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetActions } from "@/components/ui/sheet";

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
 * Hoja angosta con un solo campo de texto: renombrar un producto, nombrar una
 * lista. Abajo en el teléfono, centrada en escritorio.
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
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description} narrow>
      {/*
        El estado del campo vive en un componente aparte, con `key` en el valor
        inicial. Así el campo nace ya sembrado en vez de sincronizarse después
        con un efecto. Resembrar con setState dentro de un efecto provoca un
        render en cascada: la hoja se pinta una vez con el valor viejo y otra
        con el nuevo.
      */}
      <PromptForm
        key={initialValue}
        title={title}
        initialValue={initialValue}
        confirmLabel={confirmLabel}
        placeholder={placeholder}
        maxLength={maxLength}
        onConfirm={onConfirm}
        onClose={() => onOpenChange(false)}
      />
    </Sheet>
  );
}

function PromptForm({
  title,
  initialValue,
  confirmLabel,
  placeholder,
  maxLength,
  onConfirm,
  onClose,
}: Omit<PromptDialogProps, "open" | "onOpenChange" | "description"> & {
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
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        data-autofocus
        aria-label={title}
        className="field"
      />
      <SheetActions>
        <Button type="button" variant="soft" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={disabled}>
          {confirmLabel}
        </Button>
      </SheetActions>
    </form>
  );
}
