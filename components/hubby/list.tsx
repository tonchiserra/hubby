import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Lista agrupada al estilo iOS: una tarjeta que contiene filas separadas por
 * hairlines, sin separador en la última. El `:last-child` hace ese trabajo
 * automáticamente, así que las filas no necesitan saber su posición.
 */
export function ListGroup({
  className,
  title,
  children,
  ...props
}: React.ComponentProps<"div"> & { title?: string }) {
  return (
    <section className="flex flex-col gap-2">
      {title && (
        <h2 className="text-footnote text-muted-foreground px-1 uppercase tracking-wide">
          {title}
        </h2>
      )}
      <div
        className={cn(
          "bg-card overflow-hidden rounded-xl",
          "[&>*:not(:last-child)]:hairline-b",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </section>
  );
}

type ListRowProps = React.ComponentProps<"div"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label: React.ReactNode;
  detail?: React.ReactNode;
  /** Muestra el chevron y los estados de presionado. */
  interactive?: boolean;
};

export function ListRow({
  leading,
  trailing,
  label,
  detail,
  interactive,
  className,
  ...props
}: ListRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-touch items-center gap-3 px-4 py-2.5",
        interactive &&
          "cursor-pointer transition-colors active:bg-secondary hover:bg-secondary/60",
        className,
      )}
      {...props}
    >
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}

      <div className="min-w-0 flex-1">
        <div className="text-body truncate">{label}</div>
        {detail && (
          <div className="text-footnote text-muted-foreground truncate">
            {detail}
          </div>
        )}
      </div>

      {trailing && (
        <div className="text-subhead text-muted-foreground flex shrink-0 items-center gap-2">
          {trailing}
        </div>
      )}
      {interactive && (
        <CaretRightIcon
          size={14}
          weight="bold"
          className="text-muted-foreground/60 shrink-0"
        />
      )}
    </div>
  );
}
