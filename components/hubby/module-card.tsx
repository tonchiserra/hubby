import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de módulo del menú principal.
 *
 * Aplica la regla de color de hubby: el módulo que reclama atención se pinta
 * entero con el acento; el que está al día queda en papel. No hace falta un
 * contador de más para decir lo mismo dos veces —el color ya lo dice— así que
 * el número solo aparece cuando aporta cantidad.
 */
export function ModuleCard({
  href,
  label,
  detail,
  icon: IconComponent,
  badge,
  preview,
  className,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: Icon;
  badge?: number;
  preview?: string[];
  className?: string;
}) {
  const reclama = badge !== undefined && badge > 0;

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-touch flex-col gap-4 rounded-lg p-5",
        "shadow-card transition-[transform,box-shadow] duration-150",
        "active:scale-[0.99] hover:shadow-float",
        reclama ? "bg-accent text-accent-ink" : "bg-card text-ink",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconComponent
          size={22}
          className={reclama ? "opacity-80" : "text-ink-faint"}
        />
        {reclama && (
          <span className="text-title3 leading-none font-bold tabular-nums">
            {badge}
          </span>
        )}
      </div>

      {preview && preview.length > 0 && (
        <ul
          className={cn(
            "flex flex-col gap-1 text-subhead",
            reclama ? "opacity-90" : "text-ink-soft",
          )}
        >
          {preview.map((item) => (
            <li key={item} className="truncate">
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-headline display-tight truncate">{label}</p>
          {detail && (
            <p
              className={cn(
                "truncate text-footnote",
                reclama ? "opacity-75" : "text-ink-soft",
              )}
            >
              {detail}
            </p>
          )}
        </div>
        <ArrowUpRightIcon
          size={15}
          weight="bold"
          className={cn(
            "mb-0.5 shrink-0 transition-transform duration-150",
            "group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            reclama ? "opacity-70" : "text-ink-faint",
          )}
        />
      </div>
    </Link>
  );
}
