/**
 * Nombres de los elementos compartidos de las view transitions.
 *
 * Vive en su propio archivo, sin directiva, a propósito: lo necesitan tanto el
 * panel -Server Component- como la tarjeta. Si estuviera en view-transition.ts,
 * que lleva "use client", el servidor no podría llamarlo: esa directiva marca
 * el archivo entero, no solo el componente.
 */
export const moduleTitleTransition = (slug: string) => `modulo-${slug}`;

/**
 * Tipo de transición de las navegaciones. Va en el `transitionTypes` de cada
 * <Link> que cambia de pantalla, y es lo único que anima la <ViewTransition>
 * de `app/(app)/layout.tsx`.
 *
 * Sin el tipo, esa transición se disparaba con cualquier transición que
 * tocara la página, incluida la revalidación de una Server Action: marcar un
 * producto hacía salir y entrar la pantalla entera, como si se recargara.
 */
export const NAVEGAR = ["navegar"];
