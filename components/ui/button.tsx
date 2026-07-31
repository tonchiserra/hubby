"use client";

import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 shrink-0",
    "font-medium whitespace-nowrap select-none",
    "transition-[background-color,opacity,transform] duration-150",
    // Escala al presionar: es lo que da la sensación táctil de iOS.
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "text-primary hover:bg-accent",
        plain: "text-foreground hover:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        // 44px es el target táctil mínimo de iOS. sm/icon lo respetan igual.
        sm: "h-9 px-3 text-subhead rounded-md",
        md: "h-touch px-5 text-headline rounded-lg",
        lg: "h-13 px-6 text-headline rounded-xl",
        icon: "size-touch rounded-full",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
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
