"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-200",
        // Encendido reclama atención, así que lleva acento.
        "bg-line-strong data-[state=checked]:bg-accent",
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-[26px] rounded-full bg-white",
          "shadow-[0_2px_6px_rgb(27_28_25/0.2)]",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
