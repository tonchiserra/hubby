import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Nombres de la escala tipográfica definida en `@theme`. Hay que registrarlos
 * en tailwind-merge: si no, ve `text-headline` y `text-primary` como clases del
 * mismo grupo y descarta una de las dos, dejando componentes sin color o sin
 * tamaño según el orden en que se hayan compuesto.
 */
const FONT_SIZES = [
  "caption2",
  "caption",
  "footnote",
  "subhead",
  "callout",
  "body",
  "headline",
  "title3",
  "title2",
  "title1",
  "largetitle",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
