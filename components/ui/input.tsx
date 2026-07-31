import { cn } from "@/lib/utils";

/**
 * Campo de iOS: relleno translúcido, sin borde. El borde de 1px es un patrón
 * web; iOS distingue el campo por su relleno.
 */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-fill-tertiary text-body text-foreground placeholder:text-subtle-foreground",
        "h-touch w-full rounded-md px-3.5",
        "transition-shadow duration-150",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

/** Campo embebido en una fila de lista: sin relleno propio, la fila lo aporta. */
export function InlineInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "text-body text-foreground placeholder:text-subtle-foreground",
        "min-h-touch w-full bg-transparent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
