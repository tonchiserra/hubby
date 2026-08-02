/**
 * Precios. Sin dependencia de servidor a propósito: lo usan la lista, el
 * editor y el resumen del panel.
 */

/**
 * Se formatea el número y el signo se pone a mano, en vez de usar
 * `style: "currency"`.
 *
 * El motivo es la hidratación: el símbolo y su separación los resuelve el ICU
 * de cada entorno, y el de Node no siempre coincide con el del navegador. Un
 * espacio distinto entre "$" y el número alcanza para que React reporte que el
 * HTML del servidor no coincide. El agrupado de miles, en cambio, es estable.
 */
const ENTERO = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const CON_CENTAVOS = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Los centavos aparecen solo si los hay, pero cuando hay son los dos: "$ 1.299,5"
 * se lee como un precio a medio escribir.
 */
export function formatPrice(price: number): string {
  const redondo = Number.isInteger(price);
  return `$ ${(redondo ? ENTERO : CON_CENTAVOS).format(price)}`;
}

/**
 * Lo que se escribe en el campo de precio → número.
 *
 * El campo ya filtra a dígitos y una coma, así que acá no hay ambigüedad entre
 * separador de miles y decimal: la coma siempre decide los centavos. Devuelve
 * null para el campo vacío, que es "no sé cuánto sale" y es un valor válido.
 */
export function parsePrice(input: string): number | null {
  const limpio = input.trim().replace(",", ".");
  if (!limpio) return null;

  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/**
 * Solo dígitos y una coma, con hasta dos decimales. Se aplica en cada tecla:
 * es lo que hace que `parsePrice` no tenga que adivinar nada después.
 */
export function sanitizePriceInput(raw: string): string {
  const soloValidos = raw.replace(/[^\d,]/g, "");
  const [entero, ...resto] = soloValidos.split(",");

  if (resto.length === 0) return entero;
  return `${entero},${resto.join("").slice(0, 2)}`;
}

/**
 * El dominio del link, para mostrar dónde se compra sin ocupar una línea con
 * la URL entera. El "www." sobra: no distingue nada y roba ancho.
 */
export function storeName(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Una URL inválida no es motivo para romper la fila: simplemente no se
    // muestra la tienda. La validación de verdad ocurre al guardar.
    return null;
  }
}
