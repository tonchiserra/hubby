"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Sigue la regla de color de hubby: **lo resuelto se apaga**.
 *
 * Por eso el marcado NO lleva acento. Un producto que ya tenés en casa no
 * reclama nada, así que se pinta en gris; el acento queda libre para señalar
 * lo que sí requiere tu atención. Es al revés de lo que hace casi cualquier
 * checkbox, y es justamente lo que hace legible la lista de un vistazo.
 */
export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "grid size-[22px] shrink-0 place-items-center rounded-full",
        "border-[1.5px] border-line-strong transition-colors",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-ink-faint",
        "active:scale-90",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-card">
        <CheckIcon size={12} weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
