import { CaretRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Grupo de filas sobre una tarjeta del kit: blanca, con borde y 10px de radio.
 * El título es un rótulo -versalitas con el punto del acento-, no un `[/ … /]`.
 */
export function ListGroup({
  className,
  title,
  titleAction,
  footer,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  title?: string;
  /** Controles del grupo, a la derecha del título. */
  titleAction?: React.ReactNode;
  footer?: string;
}) {
  return (
    <section className="flex flex-col">
      {(title || titleAction) && (
        <div className="flex min-h-8 items-center justify-between gap-2 px-1 pb-2">
          {title ? <h2 className="eyebrow min-w-0 truncate">{title}</h2> : <span />}
          {titleAction}
        </div>
      )}
      <div
        className={cn(
          "bg-card border-line overflow-hidden rounded-lg border",
          className,
        )}
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
  /** Muestra el chevron y el estado de presión. */
  interactive?: boolean;
  /** Oculta el hairline inferior. */
  last?: boolean;
  /** Renderiza la fila como <button>. */
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
  const Comp = (asButton ? "button" : "div") as "div";

  return (
    <Comp
      {...(asButton ? { type: "button" as const } : {})}
      className={cn(
        asButton && "w-full text-left",
        "flex min-h-touch items-center gap-3 pl-4",
        (interactive || asButton) &&
          "hover:bg-sand/70 active:bg-sand transition-colors duration-150",
        className,
      )}
      {...props}
    >
      {/* Sin ancho fijo: el slot lo define lo que entre -una casilla de 22px o
          un chip de 32 o 40-, que antes desbordaba las 6 unidades que medía. */}
      {leading && (
        <div className="flex shrink-0 items-center justify-center">
          {leading}
        </div>
      )}
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pr-4",
          !last && "hairline-b",
        )}
      >
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
          <CaretRightIcon
            size={16}
            className="text-ink-faint shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        )}
      </div>
    </Comp>
  );
}
