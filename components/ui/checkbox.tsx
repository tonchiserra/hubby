import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Casilla redonda sobre un <input type="checkbox"> nativo: el rol, el teclado
 * y el <label htmlFor> vienen del navegador. Reemplaza al Checkbox de Radix.
 *
 * El input real va encima, transparente, y la caja se pinta con `peer`. La
 * marca entra con un pequeño rebote.
 */
export function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <span className={cn("relative grid size-[22px] shrink-0 place-items-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-full disabled:cursor-default"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none grid size-full place-items-center rounded-full",
          "border-[1.5px] border-line-strong",
          "transition-[background-color,border-color,transform] duration-200 ease-spring",
          "peer-checked:border-transparent peer-checked:bg-accent",
          "peer-active:scale-90",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          "peer-disabled:opacity-40",
          "[&>svg]:scale-50 [&>svg]:opacity-0 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100",
          "[&>svg]:transition-[transform,opacity] [&>svg]:duration-200 [&>svg]:ease-spring",
        )}
      >
        {/* La marca va sobre el acento, así que usa su tinta. */}
        <CheckIcon size={13} strokeWidth={2.4} className="text-accent-ink" />
      </span>
    </span>
  );
}
