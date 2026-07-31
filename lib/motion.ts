import type { Transition, Variants } from "motion/react";

/**
 * Vocabulario de movimiento de hubby. Todo lo que se anima en la app sale de
 * acá, para que el ritmo sea el mismo en todos los módulos.
 *
 * Son resortes, no curvas de duración fija: iOS animaba con curvas hasta que
 * pasó a física de resortes, y es lo que hace que el movimiento se sienta
 * material en vez de programado. Un resorte además absorbe interrupciones —si
 * tocás otra vez a mitad de camino, sale desde donde está y no salta.
 */

/** Reacomodo de elementos en una lista. Firme y sin rebote. */
export const springLayout: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 1,
};

/** Entradas y salidas. Un poco más suelto para que se note. */
export const springEnter: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

/** Indicadores que se deslizan, como la pastilla del control segmentado. */
export const springIndicator: Transition = {
  type: "spring",
  stiffness: 640,
  damping: 44,
  mass: 0.8,
};

/** Cambios de opacidad o color, donde un resorte no aporta nada. */
export const easeQuick: Transition = { duration: 0.18, ease: [0.32, 0.72, 0, 1] };

/**
 * Filas de lista. Se colapsa la altura además de la opacidad para que las
 * vecinas acompañen el hueco en vez de saltar.
 */
export const rowVariants: Variants = {
  initial: { opacity: 0, height: 0, scale: 0.98 },
  animate: { opacity: 1, height: "auto", scale: 1 },
  exit: { opacity: 0, height: 0, scale: 0.98 },
};

/** Bloques que aparecen y desaparecen enteros, como el grupo de "Agregar". */
export const blockVariants: Variants = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: { opacity: 1, height: "auto", y: 0 },
  exit: { opacity: 0, height: 0, y: -4 },
};
