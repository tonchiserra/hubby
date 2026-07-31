/**
 * Nombres de los elementos compartidos de las view transitions.
 *
 * Vive en su propio archivo, sin directiva, a propósito: lo necesitan tanto el
 * panel -Server Component- como la tarjeta. Si estuviera en view-transition.ts,
 * que lleva "use client", el servidor no podría llamarlo: esa directiva marca
 * el archivo entero, no solo el componente.
 */
export const moduleTitleTransition = (slug: string) => `modulo-${slug}`;
