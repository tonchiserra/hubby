import { CaretDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type PillOption<T extends string> = { value: T; label: string };

/**
 * Un `<select>` nativo con forma de píldora: para filtros y orden.
 *
 * Lo que se ve es la píldora; encima, invisible y del mismo tamaño, está el
 * select de verdad. Tocarla abre el selector del sistema -la rueda en el
 * teléfono, la lista en la compu- y el teclado y los lectores de pantalla lo
 * manejan como cualquier select, sin una línea de JS propia.
 *
 * `active` es para un filtro puesto: va en el acento sólido, porque está
 * escondiendo cosas y no te tenés que olvidar de que está.
 */
export function SelectPill<T extends string>({
  label,
  display,
  value,
  options,
  onChange,
  active,
  className,
}: {
  /** Nombre accesible: "Año de lectura", "Ordenar". */
  label: string;
  /** Lo que muestra la píldora: el nombre del filtro o la opción elegida. */
  display: string;
  value: T;
  options: readonly PillOption<T>[];
  onChange: (value: T) => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full pr-3 pl-4",
        "text-footnote font-semibold whitespace-nowrap select-none",
        "transition-[background-color,color,scale] duration-200 ease-out active:scale-[0.97]",
        "has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        active ? "bg-accent text-accent-ink" : "bg-sand text-ink hover:bg-sand-deep",
        className,
      )}
    >
      <span aria-hidden>{display}</span>
      <CaretDownIcon
        size={14}
        className={cn("transition-colors duration-200", active ? "text-accent-ink" : "text-accent")}
      />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        // 16px aunque no se vea: con menos, iOS hace zoom al enfocarlo.
        className="absolute inset-0 cursor-pointer appearance-none rounded-full text-base opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
