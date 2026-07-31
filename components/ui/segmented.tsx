"use client";

import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: string; count?: number };

/**
 * Control segmentado de iOS: pista translúcida con una pastilla clara que marca
 * la opción activa. Se implementa con radios reales para que funcione con
 * teclado y lectores de pantalla, no con botones sueltos.
 */
export function Segmented<T extends string>({
  name,
  value,
  onChange,
  segments,
  className,
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  segments: readonly Segment<T>[];
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtro"
      className={cn(
        "bg-fill-tertiary flex gap-0.5 rounded-md p-0.5",
        className,
      )}
    >
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <label
            key={s.value}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5",
              "text-footnote font-semibold transition-colors select-none",
              "has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
              selected
                ? "bg-card text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
                : "text-muted-foreground",
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
            {s.label}
            {s.count !== undefined && (
              <span
                className={cn(
                  "tabular-nums",
                  selected ? "text-muted-foreground" : "text-subtle-foreground",
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
