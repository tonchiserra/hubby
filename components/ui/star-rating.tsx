"use client";

import { useState } from "react";
import { StarIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const ESTRELLAS = [1, 2, 3, 4, 5];

/**
 * Valoración de 0 a 5 con medios puntos.
 *
 * Cada estrella son dos zonas táctiles: la mitad izquierda vale el medio punto
 * y la derecha el punto entero. Tocar la misma valoración otra vez la limpia,
 * que es la única forma razonable de volver a "sin calificar" sin sumar un
 * botón aparte.
 *
 * El medio punto se dibuja recortando una estrella llena por encima de la
 * vacía, con `clip-path`. Es más simple que superponer dos íconos distintos y
 * queda exacto a cualquier tamaño.
 *
 * Las zonas son `<button>` reales, así que la valoración se puede recorrer y
 * fijar con el teclado, no solo tocando.
 */
export function StarRating({
  value,
  onChange,
  size = 22,
  readOnly,
  className,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const mostrado = hover ?? value ?? 0;

  if (readOnly) {
    return (
      <div
        className={cn("flex items-center gap-0.5", className)}
        role="img"
        aria-label={value === null ? "Sin calificar" : `${value} de 5 estrellas`}
      >
        {ESTRELLAS.map((n) => (
          <Estrella key={n} indice={n} valor={mostrado} size={size} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onPointerLeave={() => setHover(null)}
    >
      {ESTRELLAS.map((n) => (
        <span key={n} className="relative inline-flex">
          <Estrella indice={n} valor={mostrado} size={size} />

          {/* Dos mitades por estrella: media y entera. */}
          {[n - 0.5, n].map((puntos) => (
            <button
              key={puntos}
              type="button"
              // Tocar el mismo valor otra vez limpia la calificación.
              onClick={() => onChange?.(value === puntos ? null : puntos)}
              onPointerEnter={() => setHover(puntos)}
              onFocus={() => setHover(puntos)}
              onBlur={() => setHover(null)}
              aria-label={`${puntos} ${puntos === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={value === puntos}
              className={cn(
                "absolute inset-y-0 w-1/2",
                puntos === n - 0.5 ? "left-0" : "right-0",
                "focus-visible:outline-accent rounded-sm focus-visible:outline-2",
              )}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

function Estrella({
  indice,
  valor,
  size,
}: {
  indice: number;
  valor: number;
  size: number;
}) {
  // 0 = vacía, 0.5 = mitad, 1 = llena.
  const llenado = Math.max(0, Math.min(1, valor - indice + 1));

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <StarIcon size={size} weight="regular" className="text-ink-faint absolute" />
      {llenado > 0 && (
        <StarIcon
          size={size}
          weight="fill"
          className="text-accent absolute"
          // Recorta la estrella llena al porcentaje exacto: exacto a cualquier
          // tamaño, sin necesidad de un ícono de media estrella.
          style={{ clipPath: `inset(0 ${(1 - llenado) * 100}% 0 0)` }}
        />
      )}
    </span>
  );
}
