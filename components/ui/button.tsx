"use client";

import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  [
    "inline-flex items-center justify-center gap-2 shrink-0",
    "whitespace-nowrap select-none",
    "transition-[opacity,transform] duration-150",
    // iOS no oscurece al presionar: baja la opacidad y encoge apenas.
    "active:opacity-60 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        /** Botón lleno de iOS: capsular, azul de sistema. */
        filled: "bg-primary text-primary-foreground font-semibold rounded-full",
        /** Gris translúcido, sobre tarjeta o sobre fondo. */
        tinted: "bg-fill-tertiary text-primary font-semibold rounded-full",
        /** Solo texto: el estilo por defecto de las acciones en iOS. */
        plain: "text-primary",
        destructive: "text-destructive",
      },
      size: {
        sm: "h-8 px-3 text-subhead",
        md: "h-touch px-5 text-body",
        lg: "h-13 px-6 text-headline",
        icon: "size-touch rounded-full",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "filled", size: "md" },
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
