import { cn } from "@/lib/utils";

/** Campo suelto: papel hundido, sin borde. El borde de 1px es ruido. */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-card-sunken text-body text-ink placeholder:text-ink-faint",
        "h-11 w-full rounded-md px-4",
        "transition-shadow duration-150",
        "focus:outline-none focus:ring-2 focus:ring-accent/35",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

/** Campo embebido en una fila: sin relleno propio, la fila lo aporta. */
export function InlineInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "text-body text-ink placeholder:text-ink-faint",
        "min-h-touch w-full bg-transparent focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
