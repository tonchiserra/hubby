import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tag = cva(
  [
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
    // Mismo tamaño que el "FALTA" del supermercado: versalitas chicas, para
    // que la etiqueta informe sin competir con el título.
    "text-[10px] leading-[14px] font-semibold tracking-wide uppercase",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        /** Reclama atención: relleno sólido. */
        accent: "bg-accent text-accent-ink",
        /** Pertenece al módulo y está resuelto: lavado del acento. */
        wash: "bg-accent-wash text-accent",
      },
      interactive: {
        true: "transition-transform active:scale-95 cursor-pointer",
      },
    },
    defaultVariants: { variant: "wash" },
  },
);

type TagProps = React.ComponentProps<"span"> & VariantProps<typeof tag>;

export function Tag({ className, variant, interactive, ...props }: TagProps) {
  return (
    <span className={cn(tag({ variant, interactive }), className)} {...props} />
  );
}

/** Misma pastilla, pero como botón: para los estados que se pueden cambiar. */
export function TagButton({
  className,
  variant,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof tag>) {
  return (
    <button
      type="button"
      className={cn(
        tag({ variant, interactive: true }),
        "focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}
