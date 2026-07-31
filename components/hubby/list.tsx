import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Lista "inset grouped" de iOS: tarjeta de radio 10, filas separadas por
 * hairlines que arrancan alineados con el texto -no con el borde- y sin
 * separador en la última.
 */
export function ListGroup({
  className,
  title,
  footer,
  children,
  ...props
}: React.ComponentProps<"div"> & { title?: string; footer?: string }) {
  return (
    <section className="flex flex-col">
      {title && (
        // Header de sección de iOS: versalitas grises, indentado como el texto
        // de las filas, con aire generoso arriba.
        <h2 className="text-footnote text-muted-foreground px-4 pb-1.5 uppercase">
          {title}
        </h2>
      )}
      <div
        className={cn("bg-card overflow-hidden rounded-md", className)}
        {...props}
      >
        {children}
      </div>
      {footer && (
        <p className="text-footnote text-muted-foreground px-4 pt-1.5">
          {footer}
        </p>
      )}
    </section>
  );
}

type ListRowProps = Omit<React.ComponentProps<"div">, "title"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label: React.ReactNode;
  detail?: React.ReactNode;
  /** Muestra el chevron y el resaltado al presionar. */
  interactive?: boolean;
  /** Última fila del grupo: sin separador. */
  last?: boolean;
};

export function ListRow({
  leading,
  trailing,
  label,
  detail,
  interactive,
  last,
  className,
  ...props
}: ListRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-touch items-center gap-3 pr-4 pl-4",
        // El separador arranca donde arranca el texto. Si la fila tiene un
        // elemento a la izquierda, se corre para dejarlo pasar.
        !last && "hairline-b",
        leading && "[--hairline-inset:3.25rem]",
        !leading && "[--hairline-inset:1rem]",
        interactive && "active:bg-fill-tertiary transition-colors",
        className,
      )}
      {...props}
    >
      {leading && (
        <div className="flex w-6 shrink-0 items-center justify-center">
          {leading}
        </div>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-body truncate">{label}</div>
          {detail && (
            <div className="text-footnote text-muted-foreground truncate">
              {detail}
            </div>
          )}
        </div>

        {trailing && (
          <div className="text-body text-muted-foreground flex shrink-0 items-center gap-2 tabular-nums">
            {trailing}
          </div>
        )}
        {interactive && (
          <CaretRightIcon
            size={14}
            weight="bold"
            className="text-subtle-foreground shrink-0"
          />
        )}
      </div>
    </div>
  );
}
