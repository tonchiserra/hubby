import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Grupo de filas sobre una tarjeta que flota. */
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
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <h2 className="text-caption text-ink-soft truncate font-medium tracking-wide uppercase">
            {title}
          </h2>
          {titleAction}
        </div>
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
        // El padding derecho vive en el bloque de texto, no acá: así el
        // separador puede dibujarse sobre ese bloque y llegar igual al borde.
        "flex min-h-touch items-center gap-3 pl-5",
        interactive && "hover:bg-card-sunken/60 active:bg-card-sunken transition-colors",
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
          "flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pr-5",
          // El separador arranca donde arranca el texto, no en el borde. Se
          // dibuja sobre este bloque en vez de sobre la fila entera para que
          // quede alineado con cualquier cosa que entre en `leading`, sin tener
          // que adivinar cuánto mide.
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
          <CaretRightIcon size={13} weight="bold" className="text-ink-faint shrink-0" />
        )}
      </div>
    </Comp>
  );
}
