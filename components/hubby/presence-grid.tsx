"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { merge, type Entry } from "./presence";

/**
 * PresenceList para grillas: celdas que entran, salen y se reacomodan
 * animadas, sin librería.
 *
 * En una lista alcanza con llevar la altura de la fila a cero y lo de abajo
 * acompaña solo. En una grilla no: cuando una tapa se va, las de al lado
 * cambian de fila y columna, y eso CSS no lo puede interpolar. Por eso:
 *
 * - **Lo que se va** sale del flujo en el acto (absoluto, en la caja que
 *   ocupaba) y se desvanece ahí, en vez de sostener su hueco hasta terminar.
 * - **Lo que se mueve** se anima con FLIP: se mide dónde quedó cada celda
 *   después del commit, se la devuelve con `translate` a donde estaba y se la
 *   suelta hacia cero con la API de animaciones del navegador.
 * - **Lo que llega** aparece con `.celda[data-enter]` de globals.css.
 *
 * Las cajas se guardan relativas al contenedor (offsetLeft/offsetTop), así el
 * scroll no las cambia y una animación en curso no ensucia la medición. El
 * contenedor es `relative` por eso mismo, y porque useReorder también mide
 * contra él.
 */

type Caja = { x: number; y: number; w: number; h: number };

/** Identifica las animaciones propias, para cancelar solo esas. */
const FLIP = "flip";
const DURACION_MS = 420;
/** --ease-out-kit: la API de animaciones no lee variables CSS. */
const CURVA = "cubic-bezier(0.22, 1, 0.36, 1)";

const caja = (el: HTMLElement): Caja => ({
  x: el.offsetLeft,
  y: el.offsetTop,
  w: el.offsetWidth,
  h: el.offsetHeight,
});

/**
 * Cuánto está corrida una celda respecto de su lugar en el layout: un FLIP a
 * medio camino (`translate`) o el arrastre (`transform`). Sumarlo hace que
 * una animación interrumpida arranque desde donde se veía la celda, y que al
 * soltar un arrastre -que ya dejó todo en su lugar- no se anime nada.
 */
function corrimiento(el: HTMLElement): [number, number] {
  const estilo = getComputedStyle(el);
  let x = 0;
  let y = 0;
  if (estilo.translate && estilo.translate !== "none") {
    const [a, b] = estilo.translate.split(" ");
    x += parseFloat(a) || 0;
    y += parseFloat(b ?? "") || 0;
  }
  if (estilo.transform && estilo.transform !== "none") {
    const m = new DOMMatrixReadOnly(estilo.transform);
    x += m.m41;
    y += m.m42;
  }
  return [x, y];
}

export function PresenceGrid<T>({
  items,
  getKey,
  ref,
  className,
  children,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  /** El contenedor, para quien lo necesite medir: el `container` de useReorder. */
  ref?: React.RefObject<HTMLDivElement | null>;
  /** Las columnas y el espaciado: `grid-cols-2 gap-4`, por ejemplo. */
  className?: string;
  children: (item: T, meta: { leaving: boolean }) => React.ReactNode;
}) {
  const [prevItems, setPrevItems] = useState(items);
  const [entries, setEntries] = useState<Entry<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, leaving: false, entering: false })),
  );

  if (items !== prevItems) {
    setPrevItems(items);
    setEntries(merge(entries, items, getKey));
  }

  const propio = useRef<HTMLDivElement>(null);
  const raiz = ref ?? propio;
  const cajas = useRef(new Map<string, Caja>());

  useLayoutEffect(() => {
    const root = raiz.current;
    if (!root) return;
    const celdas = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-key]"));

    // Primero se sacan del flujo las que se van, para que la medición de las
    // demás ya sea la del layout final.
    for (const el of celdas) {
      const antes = cajas.current.get(el.dataset.key!);
      if (el.hasAttribute("data-leaving")) {
        if (antes && el.style.position !== "absolute") {
          el.getAnimations().forEach((a) => a.id === FLIP && a.cancel());
          Object.assign(el.style, {
            position: "absolute",
            left: `${antes.x}px`,
            top: `${antes.y}px`,
            width: `${antes.w}px`,
            height: `${antes.h}px`,
          });
        }
      } else if (el.style.position === "absolute") {
        // Volvió mientras se iba: recupera su lugar en la grilla.
        Object.assign(el.style, { position: "", left: "", top: "", width: "", height: "" });
      }
    }

    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alto = window.innerHeight;
    const arriba = root.getBoundingClientRect().top;
    const fueraDeVista = (y: number, h: number) => arriba + y + h < 0 || arriba + y > alto;
    const vivas = new Set<string>();

    for (const el of celdas) {
      const key = el.dataset.key!;
      vivas.add(key);
      if (el.hasAttribute("data-leaving")) continue;

      const antes = cajas.current.get(key);
      const ahora = caja(el);
      cajas.current.set(key, ahora);
      if (!antes || reducir) continue;
      // No cambió de lugar: si venía animándose, que siga.
      if (antes.x === ahora.x && antes.y === ahora.y) continue;

      const [tx, ty] = corrimiento(el);
      const dx = antes.x + tx - ahora.x;
      const dy = antes.y + ty - ahora.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      // Lo que no se ve ni antes ni después salta directo: animar cien tapas
      // fuera de pantalla es trabajo que nadie mira.
      if (fueraDeVista(antes.y + ty, antes.h) && fueraDeVista(ahora.y, ahora.h)) continue;

      el.getAnimations().forEach((a) => a.id === FLIP && a.cancel());
      const anim = el.animate(
        [{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }],
        { duration: DURACION_MS, easing: CURVA },
      );
      anim.id = FLIP;
    }

    for (const key of cajas.current.keys()) if (!vivas.has(key)) cajas.current.delete(key);
  }, [entries, raiz]);

  // Si cambia el ancho -girar el teléfono, agrandar la ventana- las celdas se
  // reacomodan sin commit. Se vuelven a medir para que la próxima animación
  // no arranque desde el layout de antes.
  useEffect(() => {
    const root = raiz.current;
    if (!root) return;
    const observador = new ResizeObserver(() => {
      root.querySelectorAll<HTMLElement>(":scope > [data-key]").forEach((el) => {
        if (!el.hasAttribute("data-leaving")) cajas.current.set(el.dataset.key!, caja(el));
      });
    });
    observador.observe(root);
    return () => observador.disconnect();
  }, [raiz]);

  return (
    <div ref={raiz} className={cn("relative grid", className)}>
      {entries.map((e) => (
        <div
          key={e.key}
          className="celda"
          data-key={e.key}
          data-enter={e.entering || undefined}
          data-leaving={e.leaving || undefined}
          aria-hidden={e.leaving || undefined}
          onAnimationEnd={(ev) => {
            if (ev.target !== ev.currentTarget) return;
            if (e.leaving) {
              setEntries((all) => all.filter((x) => !(x.key === e.key && x.leaving)));
            } else if (e.entering) {
              // Mover un nodo en el DOM reinicia sus animaciones CSS: sin
              // esto, ordenar repetiría la entrada de todo lo agregado.
              setEntries((all) =>
                all.map((x) => (x.key === e.key && x.entering ? { ...x, entering: false } : x)),
              );
            }
          }}
        >
          {children(e.item, { leaving: e.leaving })}
        </div>
      ))}
    </div>
  );
}
