"use client";

import { useRef } from "react";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const ACTION_WIDTH = 88;
/** Pasado este punto, al soltar queda abierto; si no, vuelve solo. */
const COMMIT = ACTION_WIDTH * 0.6;
/** Hasta acá el gesto se considera un tap, no un swipe. */
const SLOP = 6;
const EASE = "transform 260ms cubic-bezier(0.32,0.72,0,1)";

/**
 * Deslizar hacia la izquierda para borrar: el gesto de iOS para acciones
 * destructivas en listas. Reemplaza a los botones inline, que ensucian la fila
 * y no existen en el lenguaje del sistema.
 *
 * Todo el gesto se maneja con refs y tocando el DOM directamente. Con estado de
 * React el guard de "estoy arrastrando" todavía es false cuando llega el primer
 * pointermove -el re-render no ocurrió- y además cada movimiento del dedo
 * dispararía un render entero.
 *
 * El botón queda accesible por teclado igual: un gesto no puede ser la única
 * forma de llegar a una acción.
 */
export function SwipeRow({
  onDelete,
  deleteLabel,
  children,
  className,
}: {
  onDelete: () => void;
  deleteLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const offset = useRef(0);
  const active = useRef(false);
  const decided = useRef(false);

  const place = (x: number, animate: boolean) => {
    const el = panel.current;
    if (!el) return;
    el.style.transition = animate ? EASE : "none";
    el.style.transform = `translate3d(${x}px,0,0)`;
    offset.current = x;
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
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
      // A partir de acá el puntero es nuestro aunque se salga de la fila.
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const next = Math.min(0, Math.max(-ACTION_WIDTH * 1.25, startOffset.current + dx));
    place(next, false);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    active.current = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!decided.current) return; // fue un tap
    place(offset.current <= -COMMIT ? -ACTION_WIDTH : 0, true);
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* La acción vive debajo y se descubre al deslizar. */}
      <button
        type="button"
        aria-label={deleteLabel}
        onClick={() => {
          place(0, false);
          onDelete();
        }}
        style={{ width: ACTION_WIDTH }}
        className="bg-destructive absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 text-white"
      >
        <TrashIcon size={20} />
        <span className="text-caption2">Borrar</span>
      </button>

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
