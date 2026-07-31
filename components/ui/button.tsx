"use client";

import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 shrink-0",
    "whitespace-nowrap select-none font-medium",
    "transition-[background-color,opacity,transform] duration-150",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        /** La acción principal. Lleva el acento porque reclama atención. */
        solid: "bg-accent text-accent-ink hover:bg-accent-hover rounded-full",
        /** Secundaria: papel hundido, sin color. */
        soft: "bg-card-sunken text-ink hover:bg-line rounded-full",
        /** Solo texto. Sin color salvo que sea la acción principal. */
        quiet: "text-ink-soft hover:text-ink",
        destructive: "text-danger hover:bg-danger-wash rounded-full",
      },
      size: {
        sm: "h-8 px-3 text-footnote",
        md: "h-10 px-4 text-subhead",
        lg: "h-12 px-6 text-body",
        icon: "size-10 rounded-full",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof button> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp className={cn(button({ variant, size, block }), className)} {...props} />
  );
}

export { button as buttonVariants };
