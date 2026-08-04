/**
 * Valida el `?next=` con el que el login vuelve a donde el usuario quería ir.
 *
 * No alcanza con `startsWith("/")`, que era el chequeo anterior: el navegador
 * resuelve `//evil.com` como una URL absoluta con el protocolo actual, y
 * normaliza `/\evil.com` al mismo destino. Las dos empiezan con barra y las dos
 * sacan del sitio, que es exactamente lo que el parámetro no puede hacer.
 *
 * Devuelve la home ante cualquier duda: perder el destino es una molestia,
 * mandar a alguien recién autenticado a un sitio ajeno es otra cosa.
 */
export function rutaInterna(next: string | undefined | null): string {
  if (!next || !next.startsWith("/")) return "/";
  if (next[1] === "/" || next[1] === "\\") return "/";
  return next;
}
