"use client";

import { useEffect, useRef } from "react";

/**
 * Reordenar una lista arrastrando, sin `motion`.
 *
 * Reemplaza al `Reorder` de motion, que era la razón principal para cargar la
 * librería en Libros. El gesto es el mismo: el arrastre lo arranca quien usa
 * el hook -en Libros, una presión sostenida- y desde ahí la fila sigue al
 * dedo mientras las demás se corren para dejarle lugar.
 *
 * Todo pasa tocando el DOM con refs, como en SwipeRow: con estado de React
 * cada movimiento del dedo sería un render entero. React recién se entera al
 * soltar, con el orden nuevo.
 *
 * Las filas se buscan por `data-key` dentro del contenedor: son los
 * envoltorios de PresenceList, que no recortan su contenido (el recorte está
 * en el hijo), así que se pueden desplazar sin que la fila se corte.
 */
export function useReorder({
  onStart,
  onEnd,
}: {
  onStart?: (key: string) => void;
  /** El orden que quedó, o `null` si la fila volvió a su lugar. */
  onEnd: (keys: string[] | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cleanup = useRef<(() => void) | null>(null);

  // Si la pantalla se desmonta en pleno arrastre, se sueltan los listeners.
  useEffect(() => () => cleanup.current?.(), []);

  function start(key: string, clientY: number) {
    const root = container.current;
    if (!root) return;

    const rows = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-key]")).filter(
      (el) => !el.hasAttribute("data-leaving"),
    );
    const keys = rows.map((el) => el.dataset.key!);
    const from = keys.indexOf(key);
    if (from === -1) return;

    const heights = rows.map((el) => el.getBoundingClientRect().height);
    const tops = rows.map((el) => el.getBoundingClientRect().top);
    const dragged = rows[from];
    const size = heights[from];
    let to = from;

    onStart?.(key);
    navigator.vibrate?.(8);

    rows.forEach((el, i) => {
      el.style.transition =
        i === from
          ? "box-shadow 200ms ease, scale 200ms ease"
          : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
    });
    dragged.style.position = "relative";
    dragged.style.zIndex = "10";
    dragged.style.scale = "1.02";
    dragged.style.boxShadow = "var(--shadow-float)";

    const centre = tops[from] + size / 2;

    const move = (e: PointerEvent) => {
      const dy = e.clientY - clientY;
      dragged.style.transform = `translate3d(0, ${dy}px, 0)`;

      // El lugar nuevo es cuántas de las otras filas quedan con el centro por
      // encima del centro de la que se arrastra.
      const now = centre + dy;
      let target = 0;
      rows.forEach((_, i) => {
        if (i !== from && tops[i] + heights[i] / 2 < now) target++;
      });
      if (target === to) return;
      to = target;

      rows.forEach((el, i) => {
        if (i === from) return;
        const shift =
          from < to && i > from && i <= to
            ? -size
            : to < from && i >= to && i < from
              ? size
              : 0;
        el.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : "";
      });
    };

    // Sin esto el navegador toma el arrastre vertical como scroll. Tiene que
    // ser no pasivo para poder cancelarlo.
    const block = (e: TouchEvent) => e.preventDefault();

    const finish = () => {
      cleanup.current?.();

      // La fila termina de ir a su lugar y recién ahí se reordena el DOM.
      const offset =
        to > from
          ? heights.slice(from + 1, to + 1).reduce((a, b) => a + b, 0)
          : -heights.slice(to, from).reduce((a, b) => a + b, 0);
      dragged.style.transition =
        "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, scale 200ms ease";
      dragged.style.transform = `translate3d(0, ${offset}px, 0)`;
      dragged.style.scale = "";
      dragged.style.boxShadow = "";

      window.setTimeout(() => {
        const next = [...keys];
        next.splice(to, 0, next.splice(from, 1)[0]);
        // onEnd reordena con flushSync; después se limpian los desplazamientos
        // sin transición, así no hay un cuadro con el orden viejo.
        onEnd(to === from ? null : next);
        rows.forEach((el) => {
          el.style.transition = "none";
          el.style.transform = "";
          el.style.position = "";
          el.style.zIndex = "";
        });
        requestAnimationFrame(() => rows.forEach((el) => (el.style.transition = "")));
      }, 200);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    document.addEventListener("touchmove", block, { passive: false });
    cleanup.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.removeEventListener("touchmove", block);
      cleanup.current = null;
    };
  }

  return { container, start };
}
