import { cva, type VariantProps } from "class-variance-authority";
import type { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Todo ícono de la app vive adentro de uno de estos.
 *
 * Es la pieza que más se repite y por eso es la firma visual del sistema: el
 * círculo lavado con el acento es lo que hace que una pantalla se vea "de
 * Libros" o "de Supermercado" sin pintar un solo fondo.
 */
const chip = cva(
  "grid shrink-0 place-items-center rounded-full transition-[background-color,color,transform] duration-300 ease-out",
  {
    variants: {
      tone: {
        /** Pertenece al módulo. Es el caso normal. */
        wash: "bg-accent-chip text-accent",
        /** Reclama atención: relleno sólido. */
        solid: "bg-accent text-accent-ink",
        /** Neutro: Ajustes y lo que no es de ningún módulo. */
        quiet: "bg-sand text-ink-soft",
      },
      size: { sm: "size-8", md: "size-10", lg: "size-14" },
    },
    defaultVariants: { tone: "wash", size: "md" },
  },
);

const TAMANO_ICONO = { sm: 17, md: 21, lg: 26 } as const;

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
