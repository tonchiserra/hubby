import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: string; count?: number };

/**
 * Control segmentado del kit: pista clara y una pastilla blanca que marca la
 * opción activa.
 *
 * La pastilla es un solo elemento que se desliza a la opción elegida. Su
 * posición la fija CSS con `:has(input:checked)` (ver `.seg` en globals.css):
 * no hay que medir nada ni cargar una librería de animación.
 *
 * Se implementa con radios reales para que funcione con teclado y lectores de
 * pantalla, no con botones sueltos.
 */
export function Segmented<T extends string>({
  name,
  value,
  onChange,
  segments,
  label = "Filtro",
  className,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  segments: readonly Segment<T>[];
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("seg", className)}
      style={{ "--seg-n": segments.length } as React.CSSProperties}
    >
      <span className="seg-thumb" aria-hidden />
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <label
            key={s.value}
            className={cn(
              "relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 select-none",
              "text-footnote font-medium transition-colors duration-300 ease-out",
              "has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1",
              selected ? "text-ink font-semibold" : "text-ink-soft hover:text-ink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={s.value}
              checked={selected}
              onChange={() => onChange(s.value)}
              className="sr-only"
            />
            <span>{s.label}</span>
            {s.count !== undefined && (
              <span
                className={cn(
                  "tabular-nums transition-colors duration-300",
                  selected ? "text-accent" : "text-ink-faint",
                )}
              >
                {s.count}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
