"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Círculo relleno al marcar, como los checklists de Recordatorios de iOS —
 * en vez del cuadrado con tilde que usa la web por convención.
 */
export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-6 shrink-0 rounded-full border-2 border-input",
        "grid place-items-center transition-colors duration-150",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-primary-foreground">
        <CheckIcon size={14} weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
