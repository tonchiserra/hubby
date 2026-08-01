import type { Icon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Todo ícono de la app vive adentro de uno de estos.
 *
 * Es la pieza que más se repite y por eso es la firma visual del sistema: el
 * círculo teñido con el color del módulo es lo que hace que una pantalla se
 * vea "de Libros" o "de Supermercado" sin pintar un solo fondo.
 */
const chip = cva("grid shrink-0 place-items-center rounded-full", {
  variants: {
    tone: {
      /** Pertenece al módulo. Es el caso normal. */
      wash: "bg-accent-chip text-accent",
      /** Reclama atención: relleno sólido. */
      solid: "bg-accent-gradient text-accent-ink",
      /** Sobre una superficie que ya está teñida con el acento. */
      onAccent: "bg-white/15 text-accent-ink",
    },
    size: { sm: "size-8", md: "size-10", lg: "size-12" },
  },
  defaultVariants: { tone: "wash", size: "md" },
});

const TAMANO_ICONO = { sm: 16, md: 20, lg: 24 } as const;

export function IconChip({
  icon: IconComponent,
  tone,
  size = "md",
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof chip> & { icon: Icon; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn(chip({ tone, size }), className)} aria-hidden {...props}>
      <IconComponent size={TAMANO_ICONO[size]} />
    </span>
  );
}
