import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-secondary text-muted-foreground",
        accent: "bg-accent text-accent-foreground",
        positive: "bg-accent text-positive",
        negative: "bg-destructive/12 text-negative",
      },
      size: {
        sm: "h-5 px-2 text-caption2",
        md: "h-6 px-2.5 text-caption",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
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
