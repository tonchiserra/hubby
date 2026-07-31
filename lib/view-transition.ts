"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Navegación con la View Transitions API nativa del navegador.
 *
 * No se usa el componente ViewTransition de React ni el flag
 * experimental.viewTransition de Next: ese componente solo existe en el canal
 * experimental de React -react 19.2 estable no lo exporta- y pasar la app a un
 * canal inestable por un efecto visual no vale la pena.
 *
 * EL PUNTO FINO es cuándo soltar la transición. Mientras está abierta, el
 * navegador congela la pantalla; hay que soltarla apenas exista el DOM de
 * destino, ni antes ni después.
 *
 * Se intentó primero esperar a que React commiteara la ruta nueva, escuchando
 * el cambio de pathname desde el layout. No sirve, por dos razones que se
 * suman: la navegación es dinámica y consulta Supabase, así que el árbol final
 * tarda más de un segundo; y mientras la transición está abierta el navegador
 * SUPRIME el pintado, así que un efecto -que se agenda después de pintar- no
 * llega a correr. Esperar así congelaba la pantalla 1,5 segundos.
 *
 * Lo que sí funciona: soltar apenas commitea `loading.tsx`, que es inmediato y
 * ya trae el título con el mismo `view-transition-name`. El título viaja contra
 * el esqueleto y el contenido real entra después. Medido: empieza a animar a
 * los ~145 ms, contra ~1520 ms del intento anterior.
 */
const COMMIT_ESQUELETO_MS = 120;

export function useViewTransitionNavigate() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      if (typeof document === "undefined" || !document.startViewTransition) {
        router.push(href);
        return;
      }

      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            router.push(href);
            setTimeout(resolve, COMMIT_ESQUELETO_MS);
          }),
      );
    },
    [router],
  );
}
