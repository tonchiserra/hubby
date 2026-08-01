"use client";

import { useEffect, useRef } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ACTION_WIDTH = 84;
/** Pasado este punto, al soltar queda abierto; si no, vuelve solo. */
const COMMIT_RATIO = 0.6;
/** Hasta acá el gesto se considera un tap, no un swipe. */
const SLOP = 6;
const EASE = "transform 260ms cubic-bezier(0.32,0.72,0,1)";

export type SwipeAction = {
  label: string;
  icon: Icon;
  onSelect: () => void;
  tone?: "neutral" | "destructive";
};

/**
 * Deslizar hacia la izquierda para revelar acciones, como en las listas de iOS.
 *
 * El gesto se maneja con refs y tocando el DOM directamente. Con estado de React
 * el guard de "estoy arrastrando" todavía es false cuando llega el primer
 * pointermove -el re-render no ocurrió- y además cada movimiento del dedo
 * dispararía un render entero.
 *
 * Las acciones son botones reales, así que siguen alcanzables por teclado: un
 * gesto no puede ser la única vía a una acción.
 */
export function SwipeRow({
  actions,
  children,
  className,
  disabled,
}: {
  actions: SwipeAction[];
  children: React.ReactNode;
  className?: string;
  /**
   * Apaga el gesto. Lo usa la lista de libros mientras se arrastra para
   * reordenar: los dos gestos viven en la misma fila y no pueden estar activos
   * a la vez.
   */
  disabled?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const offset = useRef(0);
  const active = useRef(false);
  const decided = useRef(false);

  const openWidth = ACTION_WIDTH * actions.length;

  const place = (x: number, animate: boolean) => {
    const el = panel.current;
    if (!el) return;
    el.style.transition = animate ? EASE : "none";
    el.style.transform = `translate3d(${x}px,0,0)`;
    offset.current = x;
  };

  const close = () => place(0, true);

  // Si el gesto se apaga a mitad de camino -porque arrancó un arrastre para
  // reordenar- la fila vuelve a su lugar en vez de quedar corrida. Va en un
  // efecto porque toca el DOM: hacerlo en el render lee refs antes de tiempo.
  useEffect(() => {
    if (!disabled) return;
    active.current = false;
    place(0, true);
  }, [disabled]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startOffset.current = offset.current;
    active.current = true;
    decided.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    const dx = e.clientX - startX.current;

    // Hasta superar el umbral no se decide si es tap o swipe; así los toques
    // sobre el checkbox siguen funcionando.
    if (!decided.current) {
      if (Math.abs(dx) < SLOP) return;
      decided.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    place(Math.min(0, Math.max(-openWidth * 1.2, startOffset.current + dx)), false);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    active.current = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!decided.current) return; // fue un tap
    place(offset.current <= -openWidth * COMMIT_RATIO ? -openWidth : 0, true);
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Las acciones viven debajo y se descubren al deslizar. */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            aria-label={a.label}
            onClick={() => {
              close();
              a.onSelect();
            }}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-white",
              a.tone === "destructive" ? "bg-danger" : "bg-card-sunken",
            )}
          >
            <a.icon size={20} />
            <span className="text-micro">{a.label}</span>
          </button>
        ))}
      </div>

      <div
        ref={panel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: "translate3d(0,0,0)", touchAction: "pan-y" }}
        className="bg-card relative"
      >
        {children}
      </div>
    </div>
  );
}
