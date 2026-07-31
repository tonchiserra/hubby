"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Círculo de Recordatorios: contorno fino cuando está vacío, círculo relleno
 * con tilde al marcarse. No es el cuadrado con tilde de la web.
 */
export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "group grid size-6 shrink-0 place-items-center rounded-full",
        "transition-transform active:scale-90",
        "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <CircleIcon
        size={24}
        weight="regular"
        className="text-subtle-foreground group-data-[state=checked]:hidden"
      />
      <CheckCircleIcon
        size={24}
        weight="fill"
        className="text-primary hidden group-data-[state=checked]:block"
      />
    </CheckboxPrimitive.Root>
  );
}
