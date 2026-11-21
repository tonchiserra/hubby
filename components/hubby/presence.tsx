"use client";

import { useState } from "react";

/**
 * Entradas y salidas animadas sin librería: reemplaza al AnimatePresence de
 * `motion`, que junto con Radix era la mayor parte del JS de cada pantalla.
 *
 * Lo único que hace falta de JS es lo que CSS no puede: seguir mostrando un
 * elemento que ya no está en los datos hasta que termine de irse. El resto es
 * la clase `.presence` de globals.css, que lleva la altura de 0fr a 1fr para
 * que lo de abajo acompañe en vez de saltar.
 *
 * El estado se ajusta durante el render cuando cambian los datos -el patrón
 * que React recomienda para derivar de una prop- y no en un efecto, que
 * pintaría una vez sin la fila saliente y la volvería a meter después.
 *
 * Solo anima lo que llega después del primer pintado, como `initial={false}`.
 * Con movimiento reducido las animaciones duran un instante: `animationend`
 * llega igual y la fila se desmonta.
 */

type Entry<T> = { key: string; item: T; leaving: boolean; entering: boolean };

function merge<T>(
  prev: Entry<T>[],
  next: readonly T[],
  getKey: (item: T) => string,
): Entry<T>[] {
  const known = new Map(prev.map((e) => [e.key, e]));
  const out: Entry<T>[] = next.map((item) => {
    const key = getKey(item);
    const before = known.get(key);
    return {
      key,
      item,
      leaving: false,
      // Lo que ya estaba sigue como estaba; lo nuevo entra animado. Una fila
      // que vuelve mientras se iba también entra.
      entering: before ? before.entering || before.leaving : true,
    };
  });

  // Lo que se fue se queda donde estaba, detrás del vecino de arriba que
  // sigue en la lista, mientras dura la salida.
  const index = new Map(out.map((e, i) => [e.key, i]));
  prev.forEach((e, i) => {
    if (index.has(e.key)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const k = index.get(prev[j].key);
      if (k !== undefined) {
        at = k + 1;
        break;
      }
    }
    out.splice(at, 0, { ...e, leaving: true });
    out.forEach((o, n) => index.set(o.key, n));
  });

  return out;
}

export function PresenceList<T>({
  items,
  getKey,
  className,
  children,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  /** Clase de cada envoltorio; por ejemplo `[--presence-gap:1.5rem]`. */
  className?: string;
  /** `last` es la última fila que se queda: la que no lleva hairline. */
  children: (item: T, meta: { last: boolean; leaving: boolean }) => React.ReactNode;
}) {
  const [prevItems, setPrevItems] = useState(items);
  const [entries, setEntries] = useState<Entry<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, leaving: false, entering: false })),
  );

  if (items !== prevItems) {
    setPrevItems(items);
    setEntries(merge(entries, items, getKey));
  }

  let lastStaying = -1;
  entries.forEach((e, i) => {
    if (!e.leaving) lastStaying = i;
  });

  return entries.map((e, i) => (
    <div
      key={e.key}
      className={className ? `presence ${className}` : "presence"}
      data-key={e.key}
      data-enter={e.entering || undefined}
      data-leaving={e.leaving || undefined}
      aria-hidden={e.leaving || undefined}
      onAnimationEnd={(ev) => {
        if (!e.leaving || ev.target !== ev.currentTarget) return;
        setEntries((all) => all.filter((x) => !(x.key === e.key && x.leaving)));
      }}
    >
      <div>{children(e.item, { last: i === lastStaying, leaving: e.leaving })}</div>
    </div>
  ));
}

/**
 * Un bloque que aparece y desaparece: el error, el "Agregar …", las acciones.
 *
 * Recibe el valor que lo hace visible en vez de un booleano, porque mientras
 * se va tiene que seguir mostrando lo último que mostró: un error que se
 * limpia se desvanece con su texto, no vacío.
 */
export function Reveal<T>({
  when,
  className,
  children,
}: {
  when: T | null | undefined | false;
  className?: string;
  children: (value: T) => React.ReactNode;
}) {
  const visible = when !== null && when !== undefined && when !== false;
  const [prev, setPrev] = useState(when);
  const [state, setState] = useState<{ value: T; leaving: boolean; entering: boolean } | null>(
    visible ? { value: when as T, leaving: false, entering: false } : null,
  );

  if (when !== prev) {
    setPrev(when);
    if (visible) {
      setState({
        value: when as T,
        leaving: false,
        entering: state === null || state.leaving || state.entering,
      });
    } else if (state && !state.leaving) {
      setState({ ...state, leaving: true });
    }
  }

  if (!state) return null;

  return (
    <div
      className={className ? `presence ${className}` : "presence"}
      data-enter={state.entering || undefined}
      data-leaving={state.leaving || undefined}
      onAnimationEnd={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (state.leaving) setState(null);
      }}
    >
      <div>{children(visible ? (when as T) : state.value)}</div>
    </div>
  );
}
