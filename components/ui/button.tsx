import { cloneElement, isValidElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botones del kit: píldoras, la principal en el acento sólido y plano.
 *
 * Ya no es un Client Component: sin el `Slot` de Radix no queda nada de
 * cliente, así que los botones de las pantallas de servidor (Ajustes, el
 * error) no suman JS.
 */
const button = cva(
  [
    "inline-flex items-center justify-center gap-2 shrink-0 rounded-full",
    "whitespace-nowrap select-none font-semibold",
    "transition-[background-color,color,box-shadow,opacity,transform] duration-150 ease-out",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        /** La acción principal: el acento sólido. */
        solid: "bg-accent text-accent-ink hover:bg-accent-hover",
        /** Secundaria: borde, sin relleno. */
        soft: "bg-card text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-sand",
        /** Terciaria: solo el texto. */
        quiet: "text-ink-soft hover:text-ink hover:bg-sand",
        destructive: "text-danger hover:bg-danger-wash",
      },
      size: {
        sm: "h-8 px-3.5 text-footnote",
        md: "h-11 px-5 text-subhead",
        lg: "h-12 px-6 text-body",
        icon: "size-11",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof button> & { asChild?: boolean };

/**
 * `asChild` le pasa el estilo al único hijo -un <Link>, por ejemplo- en vez de
 * envolverlo en un <button>, que adentro de un <a> sería HTML inválido.
 */
export function Button({
  className,
  variant,
  size,
  block,
  asChild,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(button({ variant, size, block }), className);

  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children, {
      className: cn(classes, children.props.className),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export { button as buttonVariants };
