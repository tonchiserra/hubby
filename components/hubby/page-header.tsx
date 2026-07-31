import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Large Title de iOS: 34px bold con tracking apenas negativo. El contraste
 * entre el título y el footnote de 13px es lo que crea la jerarquía, sin
 * líneas ni color.
 *
 * `back` renderiza el botón de volver al menú principal. Es la única vía de
 * navegación hacia atrás: no hay barra ni tabs.
 */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label?: string };
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start gap-3", className)}>
      {back && (
        <Link
          href={back.href}
          aria-label={back.label ?? "Volver al menú principal"}
          className={cn(
            "bg-fill-tertiary text-primary grid size-9 shrink-0 place-items-center rounded-full",
            "transition-[opacity,transform] duration-150 active:scale-90 active:opacity-60",
            // Alinea el botón con la primera línea del título, no con el bloque.
            "mt-1.5",
          )}
        >
          <CaretLeftIcon size={18} weight="bold" />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="text-largetitle -tracking-[0.02em]">{title}</h1>
        {subtitle && (
          <p className="text-subhead text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {action && <div className="mt-1.5 shrink-0">{action}</div>}
    </header>
  );
}
