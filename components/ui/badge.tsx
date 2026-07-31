import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center justify-center rounded-full font-semibold tabular-nums",
  {
    variants: {
      variant: {
        /** Contador de iOS: círculo relleno, como los badges de la tab bar. */
        count: "bg-fill text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-primary-foreground",
      },
      size: {
        sm: "min-w-5 h-5 px-1.5 text-caption2",
        md: "min-w-6 h-6 px-2 text-caption",
      },
    },
    defaultVariants: { variant: "count", size: "md" },
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
