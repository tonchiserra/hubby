import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * El título va condensado con el eje de ancho de Instrument Sans. Ese
 * estrechamiento es de dónde sale el carácter sin sumar una segunda familia
 * ni una gota de color.
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
    <header className={cn("flex flex-col gap-3", className)}>
      {back && (
        <Link
          href={back.href}
          aria-label={back.label ?? "Volver al menú principal"}
          className="text-ink-soft hover:text-ink -ml-1 inline-flex w-fit items-center gap-1.5 text-footnote transition-colors"
        >
          <ArrowLeftIcon size={15} weight="bold" />
          Menú
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-display display-tight">{title}</h1>
          {subtitle && (
            <p className="text-subhead text-ink-soft mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
