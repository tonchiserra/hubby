import { flushSync } from "react-dom";

/**
 * Corre un cambio de estado adentro de una view transition del navegador.
 *
 * Es para lo que no es navegación -el tema, por ejemplo-: las páginas las
 * anima el <ViewTransition> de React en `app/(app)/layout.tsx`, con el flag
 * `experimental.viewTransition` de Next. `flushSync` hace que el DOM nuevo
 * exista cuando el navegador toma la segunda foto.
 */
export function withViewTransition(update: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) return update();
  doc.startViewTransition(() => flushSync(update));
}
