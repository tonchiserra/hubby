import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
  {
    variants: {
      variant: {
        /** Reclama atención: lleva el acento. Es la única razón para el color. */
        attention: "bg-accent text-accent-ink",
        /** Informativo, sin urgencia. */
        quiet: "bg-card-sunken text-ink-soft",
      },
      size: {
        sm: "min-w-5 h-5 px-1.5 text-micro",
        md: "min-w-6 h-6 px-2 text-caption",
      },
    },
    defaultVariants: { variant: "attention", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ variant, size }), className)} {...props} />;
}
