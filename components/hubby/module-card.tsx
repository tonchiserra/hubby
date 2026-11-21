import Link from "next/link";
import type { Icon } from "@/components/ui/icons";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { IconChip } from "@/components/ui/icon-chip";
import { cn } from "@/lib/utils";
import { moduleTitleTransition } from "@/lib/transition-names";

/**
 * Tarjeta de módulo del menú principal.
 *
 * Aplica la regla de color de hubby sobre el material del kit: todas las
 * tarjetas son blancas con borde, y la que reclama atención lo dice con el
 * relleno de sus detalles -el chip pasa a sólido y aparece el contador, una
 * cifra en bold del acento-. Pintar la tarjeta entera era un bloque de color,
 * y en Platita la UI clara sin bloques fue un pedido explícito.
 */
export function ModuleCard({
  href,
  label,
  detail,
  icon: IconComponent,
  badge,
  preview,
  slug,
  className,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: Icon;
  /** Cuántas cosas reclaman atención. 0 o undefined: no reclama nada. */
  badge?: number;
  /** Los primeros elementos que reclaman atención, para leer sin entrar. */
  preview?: string[];
  /** Slug del módulo: nombra el elemento compartido de la transición. */
  slug?: string;
  className?: string;
}) {
  const reclama = badge !== undefined && badge > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group bg-card text-ink flex min-h-touch flex-col gap-4 rounded-lg border p-5",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
        reclama ? "border-accent/35" : "border-line",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconChip icon={IconComponent} tone={reclama ? "solid" : "wash"} />
        {/* El chip lleva el acento siempre: es lo que dice de qué módulo es la
            tarjeta. El contador aparece solo cuando hay algo que contar. */}
        {reclama && (
          <span className="cifra text-accent text-[2rem] leading-none animate-[pop_0.4s_var(--ease-spring-kit)_both]">
            {badge}
          </span>
        )}
      </div>

      {preview && preview.length > 0 && (
        <ul className="text-subhead text-ink-soft flex flex-col gap-1">
          {preview.map((item) => (
            <li key={item} className="truncate">
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-headline display-tight truncate"
            // Nombre compartido con el título de la pantalla del módulo: en la
            // view transition este texto se convierte en el encabezado.
            style={
              slug ? { viewTransitionName: moduleTitleTransition(slug) } : undefined
            }
          >
            {label}
          </p>
          {detail && (
            <p className="text-footnote text-ink-soft truncate">{detail}</p>
          )}
        </div>
        <ArrowUpRightIcon
          size={18}
          className={cn(
            "mb-0.5 shrink-0 transition-[transform,color] duration-300 ease-out",
            "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            reclama ? "text-accent" : "text-ink-faint group-hover:text-accent",
          )}
        />
      </div>
    </Link>
  );
}
