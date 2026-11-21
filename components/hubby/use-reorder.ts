"use client";

import { useEffect, useRef } from "react";

/** Distancia al borde de la pantalla desde la que el arrastre desplaza la página. */
const BORDE_PX = 80;
/** Velocidad del desplazamiento con el dedo pegado al borde, en px por cuadro. */
const VELOCIDAD_MAX = 18;
/** --ease-out-kit: los estilos en línea no leen variables CSS en transiciones armadas a mano. */
const CURVA = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Reordenar arrastrando, en una lista o en una grilla, sin `motion`.
 *
 * El arrastre lo arranca quien usa el hook -en Libros, una presión sostenida-
 * y desde ahí la celda sigue al dedo en las dos direcciones mientras las demás
 * se corren a su lugar nuevo.
 *
 * Funciona por huecos: al empezar se mide la caja de cada celda, y reordenar
 * es mandar cada una a la caja del lugar que le toca. El lugar de destino es
 * el hueco cuyo centro queda más cerca del centro de lo que se arrastra. Así
 * no importa si las celdas van en una columna o en cuatro.
 *
 * Las cajas se miden contra el contenedor (que tiene que ser `relative`, como
 * el de PresenceGrid), no contra la pantalla: el dedo cerca del borde hace
 * scroll, y medido así el scroll no desarma nada.
 *
 * Todo pasa tocando el DOM con refs, como en SwipeRow: con estado de React
 * cada movimiento del dedo sería un render entero. React recién se entera al
 * soltar, con el orden nuevo. Cómo se ve lo levantado lo decide quien usa el
 * hook, con `onStart`: acá solo se mueve.
 */
export function useReorder({
  onStart,
  onEnd,
}: {
  onStart?: (key: string) => void;
  /** El orden que quedó, o `null` si la celda volvió a su lugar. */
  onEnd: (keys: string[] | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const cleanup = useRef<(() => void) | null>(null);
  // Sigue ocupado durante el aterrizaje, después de soltar: un arrastre nuevo
  // en esos 200ms mediría las celdas todavía corridas.
  const ocupado = useRef(false);

  // Si la pantalla se desmonta en pleno arrastre, se sueltan los listeners.
  useEffect(() => () => cleanup.current?.(), []);

  function start(key: string, punto: { x: number; y: number }) {
    const root = container.current;
    if (!root || ocupado.current) return;

    const cells = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-key]")).filter(
      (el) => !el.hasAttribute("data-leaving"),
    );
    const keys = cells.map((el) => el.dataset.key!);
    const from = keys.indexOf(key);
    if (from === -1) return;
    ocupado.current = true;

    const huecos = cells.map((el) => ({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    }));
    const origen = huecos[from];
    const dragged = cells[from];
    const r0 = root.getBoundingClientRect();
    const agarre = { x: punto.x - r0.left, y: punto.y - r0.top };
    let dedo = punto;
    let to = from;

    onStart?.(key);
    navigator.vibrate?.(8);

    cells.forEach((el, i) => {
      el.style.transition =
        i === from ? `scale 200ms ${CURVA}` : `transform 240ms ${CURVA}`;
    });
    dragged.style.position = "relative";
    dragged.style.zIndex = "10";
    dragged.style.scale = "1.04";

    const mover = () => {
      const r = root.getBoundingClientRect();
      const dx = dedo.x - r.left - agarre.x;
      const dy = dedo.y - r.top - agarre.y;
      dragged.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

      const cx = origen.x + origen.w / 2 + dx;
      const cy = origen.y + origen.h / 2 + dy;
      let destino = to;
      let mejor = Infinity;
      huecos.forEach((h, i) => {
        const d = (h.x + h.w / 2 - cx) ** 2 + (h.y + h.h / 2 - cy) ** 2;
        if (d < mejor) {
          mejor = d;
          destino = i;
        }
      });
      if (destino === to) return;
      to = destino;

      // orden[j] es la celda que queda en el hueco j.
      const orden = cells.map((_, i) => i);
      orden.splice(to, 0, orden.splice(from, 1)[0]);
      orden.forEach((i, j) => {
        if (i === from) return;
        const x = huecos[j].x - huecos[i].x;
        const y = huecos[j].y - huecos[i].y;
        cells[i].style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
      });
    };

    const move = (e: PointerEvent) => {
      dedo = { x: e.clientX, y: e.clientY };
      mover();
    };

    // Con el dedo cerca del borde la página se desplaza sola: si no, una tapa
    // de abajo no se podría llevar arriba de todo, porque mientras se arrastra
    // el scroll está bloqueado.
    let cuadro = 0;
    const desplazar = () => {
      const alto = window.innerHeight;
      const fuerza =
        dedo.y < BORDE_PX
          ? -(1 - dedo.y / BORDE_PX)
          : dedo.y > alto - BORDE_PX
            ? 1 - (alto - dedo.y) / BORDE_PX
            : 0;
      if (fuerza) {
        window.scrollBy(0, Math.max(-1, Math.min(1, fuerza)) * VELOCIDAD_MAX);
        mover();
      }
      cuadro = requestAnimationFrame(desplazar);
    };
    cuadro = requestAnimationFrame(desplazar);

    // Sin esto el navegador toma el arrastre como scroll. Tiene que ser no
    // pasivo para poder cancelarlo.
    const block = (e: TouchEvent) => e.preventDefault();

    const finish = () => {
      cleanup.current?.();

      // La celda termina de ir a su hueco y recién ahí se reordena el DOM.
      const llegada = huecos[to];
      dragged.style.transition = `transform 200ms ${CURVA}, scale 200ms ${CURVA}`;
      dragged.style.transform = `translate3d(${llegada.x - origen.x}px, ${llegada.y - origen.y}px, 0)`;
      dragged.style.scale = "";

      window.setTimeout(() => {
        const next = [...keys];
        next.splice(to, 0, next.splice(from, 1)[0]);
        // onEnd reordena con flushSync; después se limpian los desplazamientos
        // sin transición, así no hay un cuadro con el orden viejo.
        onEnd(to === from ? null : next);
        cells.forEach((el) => {
          el.style.transition = "none";
          el.style.transform = "";
          el.style.position = "";
          el.style.zIndex = "";
        });
        requestAnimationFrame(() => cells.forEach((el) => (el.style.transition = "")));
        ocupado.current = false;
      }, 200);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    document.addEventListener("touchmove", block, { passive: false });
    cleanup.current = () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.removeEventListener("touchmove", block);
      cleanup.current = null;
    };
  }

  return { container, start };
}
