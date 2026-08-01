"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Sigue la regla de color de hubby: **el color marca pertenencia**.
 *
 * La marca de "hecho" lleva el acento del módulo, no gris. Antes se apagaba
 * -la regla vieja decía que lo resuelto pierde color- y como el checkbox es el
 * control principal de Supermercado, esa pantalla terminaba monocromática con
 * el uso normal de la app. La urgencia la marcan el peso y el relleno, no la
 * ausencia de color.
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
        "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-gradient",
        "active:scale-90",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {/* La marca va sobre el acento, así que usa su tinta -antes iba sobre
          gris y por eso tomaba el color de la tarjeta. */}
      <CheckboxPrimitive.Indicator className="text-accent-ink">
        <CheckIcon size={12} weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
