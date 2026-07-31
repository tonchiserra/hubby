"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { springIndicator } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type Segment<T extends string> = { value: T; label: string; count?: number };

/**
 * Control segmentado de iOS: pista translúcida con una pastilla clara que marca
 * la opción activa.
 *
 * La pastilla es un único elemento con `layoutId`, así que al cambiar de opción
 * se desliza de una a otra en vez de desaparecer y reaparecer. Motion mide las
 * dos posiciones y anima entre ellas.
 *
 * Se implementa con radios reales para que funcione con teclado y lectores de
 * pantalla, no con botones sueltos.
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
  // El layoutId tiene que ser único por instancia: si dos controles compartieran
  // el mismo, sus pastillas se animarían de uno al otro.
  const layoutId = `segmented-${useId()}`;

  return (
    <div
      role="radiogroup"
      aria-label="Filtro"
      className={cn("bg-card-sunken flex gap-0.5 rounded-lg p-0.5", className)}
    >
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <label
            key={s.value}
            className={cn(
              "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5",
              "rounded-[7px] px-2 py-1.5 select-none",
              "text-footnote font-semibold",
              "has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
              "transition-colors duration-150",
              selected ? "text-ink" : "text-ink-soft",
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={springIndicator}
                aria-hidden
                className="bg-card absolute inset-0 rounded-[7px] shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
              />
            )}
            <input
              type="radio"
              name={name}
              value={s.value}
              checked={selected}
              onChange={() => onChange(s.value)}
              className="sr-only"
            />
            {/* Por encima de la pastilla, que va en el fondo. */}
            <span className="relative">{s.label}</span>
            {s.count !== undefined && (
              <span
                className={cn(
                  "relative tabular-nums",
                  selected ? "text-ink-soft" : "text-ink-faint",
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
