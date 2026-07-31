"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Proporciones exactas del toggle de iOS: 51×31pt con pulgar de 27pt. */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-200",
        // Apagado usa systemGreen en iOS solo en Ajustes; el gris es el default.
        "bg-fill data-[state=checked]:bg-positive",
        "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-[27px] rounded-full bg-white",
          "shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)]",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
