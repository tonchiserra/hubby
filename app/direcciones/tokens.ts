/**
 * Tres direcciones visuales derivadas de las referencias que aportó Gonzalo
 * (Paperpillar, Orizon y Marko Velickovic, los tres tableros de Dribbble).
 *
 * Cada dirección es solo un juego de variables CSS. El markup de la comparación
 * es el mismo para las tres, así que lo único que cambia es la piel: es la
 * forma honesta de compararlas.
 */
export type Direccion = {
  id: string;
  nombre: string;
  tesis: string;
  /** Se inyectan como variables CSS sobre el contenedor de la dirección. */
  vars: Record<string, string>;
  /** Sombra de las tarjetas. Vacío = tarjetas planas. */
  sombra: string;
  /** Fuente de los números grandes. */
  numeros: "sans" | "mono";
};

export const DIRECCIONES: Direccion[] = [
  {
    id: "calido",
    nombre: "Panel cálido",
    tesis:
      "La mediana de tus dos referencias verdes. Lienzo beige, tarjetas blancas que flotan, verde salvia y todo bien redondeado.",
    vars: {
      "--d-canvas": "#f2f1ec",
      "--d-card": "#ffffff",
      "--d-ink": "#1c1d1a",
      "--d-ink-soft": "#7a7c74",
      "--d-line": "#e6e5de",
      "--d-accent": "#5c8a6a",
      "--d-accent-soft": "#e4ede5",
      "--d-warm": "#efe7d8",
      "--d-danger": "#c2603f",
      "--d-radius-card": "20px",
      "--d-radius-inner": "14px",
      "--d-pad": "20px",
    },
    sombra: "0 1px 2px rgb(28 29 26 / 0.04), 0 8px 24px rgb(28 29 26 / 0.06)",
    numeros: "sans",
  },
  {
    id: "caracter",
    nombre: "Panel con carácter",
    tesis:
      "La energía de la referencia de Orizon: cada módulo tiene su color y el que reclama atención se pinta entero, en vez de solo mostrar un contador.",
    vars: {
      "--d-canvas": "#f4f4f6",
      "--d-card": "#ffffff",
      "--d-ink": "#17171c",
      "--d-ink-soft": "#7c7c8a",
      "--d-line": "#e8e8ee",
      "--d-accent": "#4f46e5",
      "--d-accent-soft": "#eceafe",
      "--d-warm": "#ffe9e4",
      "--d-danger": "#e0455f",
      "--d-radius-card": "18px",
      "--d-radius-inner": "12px",
      "--d-pad": "18px",
    },
    sombra: "0 2px 4px rgb(23 23 28 / 0.04), 0 12px 28px rgb(23 23 28 / 0.07)",
    numeros: "sans",
  },
  {
    id: "sobrio",
    nombre: "Panel sobrio",
    tesis:
      "Misma paleta cálida, pero sin sombras ni redondeo grande: hairlines, radios chicos y números en monoespaciada. Prioriza el rigor sobre la suavidad.",
    vars: {
      "--d-canvas": "#efeee8",
      "--d-card": "#faf9f5",
      "--d-ink": "#20211c",
      "--d-ink-soft": "#77786e",
      "--d-line": "#dcdbd2",
      "--d-accent": "#4a6b52",
      "--d-accent-soft": "#e2e8e0",
      "--d-warm": "#e9e2d2",
      "--d-danger": "#a8503a",
      "--d-radius-card": "6px",
      "--d-radius-inner": "4px",
      "--d-pad": "16px",
    },
    sombra: "",
    numeros: "mono",
  },
];

/** Datos reales del inventario de Gonzalo, no relleno. */
export const FALTAN = ["Leche", "Yerba"];
export const EN_CASA = ["Aceite de oliva extra virgen", "Café en grano"];
