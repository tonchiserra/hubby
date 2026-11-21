import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { NAVEGAR } from "@/lib/transition-names";

/**
 * Encabezado de pantalla. El título es el titular del kit: Mona Sans
 * expandida. La vuelta al menú es una píldora, porque es lo único que se toca
 * del encabezado y la app no tiene otra navegación.
 */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
  transitionName,
  className,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label?: string };
  action?: React.ReactNode;
  /** Nombre del elemento compartido. Debe coincidir con el de la tarjeta. */
  transitionName?: string;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {back && (
        <Link
          href={back.href}
          transitionTypes={NAVEGAR}
          aria-label={back.label ?? "Volver al menú principal"}
          className={cn(
            "bg-sand text-ink-soft hover:text-ink group inline-flex h-8 w-fit items-center gap-1.5 rounded-full pr-3.5 pl-2.5",
            "text-footnote font-medium transition-colors duration-200",
          )}
        >
          <ArrowLeftIcon
            size={16}
            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          />
          Menú
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-display display-tight"
            style={transitionName ? { viewTransitionName: transitionName } : undefined}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-subhead text-ink-soft mt-1.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
