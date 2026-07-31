import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Cada módulo del menú principal. En móvil ocupa el ancho completo y en
 * escritorio entra en una grilla de tres, así que el contenido se apoya arriba
 * y el pie queda alineado aunque los textos tengan distinto largo.
 */
export function ModuleCard({
  href,
  label,
  detail,
  icon: IconComponent,
  badge,
  className,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: Icon;
  badge?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-card group flex min-h-touch flex-col gap-3 rounded-md p-4",
        "transition-[transform,background-color] duration-150",
        "active:scale-[0.98] active:bg-fill-tertiary md:hover:bg-fill-tertiary",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconComponent size={26} className="text-primary" />
        {badge !== undefined && badge > 0 && (
          <Badge variant="primary" size="sm">
            {badge}
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-headline truncate">{label}</p>
          {detail && (
            <p className="text-footnote text-muted-foreground truncate">
              {detail}
            </p>
          )}
        </div>
        <CaretRightIcon
          size={14}
          weight="bold"
          className="text-subtle-foreground mb-0.5 shrink-0"
        />
      </div>
    </Link>
  );
}
