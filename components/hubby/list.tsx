import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Grupo de filas sobre una tarjeta que flota. */
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
        <h2 className="text-caption text-ink-soft px-1 pb-2 font-medium tracking-wide uppercase">
          {title}
        </h2>
      )}
      <div
        className={cn("bg-card shadow-card overflow-hidden rounded-lg", className)}
        {...props}
      >
        {children}
      </div>
      {footer && (
        <p className="text-footnote text-ink-faint px-1 pt-2">{footer}</p>
      )}
    </section>
  );
}

type ListRowProps = Omit<React.ComponentProps<"div">, "title"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  label: React.ReactNode;
  detail?: React.ReactNode;
  interactive?: boolean;
  last?: boolean;
  asButton?: boolean;
};

export function ListRow({
  leading,
  trailing,
  label,
  detail,
  interactive,
  last,
  asButton,
  className,
  ...props
}: ListRowProps) {
  // Una fila con onClick tiene que ser un botón: como div queda fuera del
  // alcance del teclado y sin rol para lectores de pantalla.
  const Comp = (asButton ? "button" : "div") as "div";
  return (
    <Comp
      {...(asButton ? { type: "button" as const } : {})}
      className={cn(
        asButton && "w-full text-left",
        "flex min-h-touch items-center gap-3 px-5",
        // El separador arranca donde arranca el texto, no en el borde.
        !last && "hairline-b",
        leading ? "[--hairline-inset:3.5rem]" : "[--hairline-inset:1.25rem]",
        interactive && "hover:bg-card-sunken/60 active:bg-card-sunken transition-colors",
        className,
      )}
      {...props}
    >
      {leading && (
        <div className="flex w-6 shrink-0 items-center justify-center">
          {leading}
        </div>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-body truncate">{label}</div>
          {detail && (
            <div className="text-footnote text-ink-soft truncate">{detail}</div>
          )}
        </div>

        {trailing && (
          <div className="text-subhead text-ink-soft flex shrink-0 items-center gap-2 tabular-nums">
            {trailing}
          </div>
        )}
        {interactive && (
          <CaretRightIcon size={13} weight="bold" className="text-ink-faint shrink-0" />
        )}
      </div>
    </Comp>
  );
}
