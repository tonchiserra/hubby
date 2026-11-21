import type { Book } from "@/lib/supabase/types";

/**
 * Reglas de la grilla: qué libros se ven y en qué orden.
 *
 * Son puras y sin dependencias de React ni de la base, para poder probarlas
 * solas (`lib/modules/books-grid.test.ts`). La pantalla trae la biblioteca
 * entera y filtra en el cliente: es una biblioteca personal, no un catálogo.
 */

export type Orden = "manual" | "recientes" | "titulo" | "autor" | "valoracion";

/** "4" es "4 estrellas o más"; "5", exactamente 5. */
export type FiltroValoracion = "todas" | "5" | "4" | "3" | "sin";

export type Filtros = {
  /** Año de lectura. `null` = todos. */
  anio: number | null;
  valoracion: FiltroValoracion;
  /** Lo que se escribió en el buscador. */
  texto: string;
};

/**
 * Normaliza para comparar: sin acentos, sin mayúsculas, sin espacios de más.
 * Es lo que hace que "cortazar" encuentre a Cortázar.
 */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function cumpleValoracion(book: Book, filtro: FiltroValoracion): boolean {
  const { rating } = book;
  switch (filtro) {
    case "todas":
      return true;
    case "sin":
      return rating === null;
    case "5":
      return rating === 5;
    case "4":
      return rating !== null && rating >= 4;
    case "3":
      return rating !== null && rating >= 3;
  }
}

export function filtrarLibros(books: readonly Book[], filtros: Filtros): Book[] {
  const q = norm(filtros.texto);
  return books.filter(
    (b) =>
      (filtros.anio === null || b.read_year === filtros.anio) &&
      cumpleValoracion(b, filtros.valoracion) &&
      (!q || norm(b.title).includes(q) || (b.author !== null && norm(b.author).includes(q))),
  );
}

// "numeric" para que "Dune 2" vaya antes que "Dune 10"; "base" para que la
// tilde y la mayúscula no separen "Árbol" de "arbol".
const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

const porTitulo = (a: Book, b: Book) => collator.compare(a.title, b.title);

/**
 * Ordena sin tocar el arreglo original. "manual" devuelve el orden en que
 * vienen, que es el de `position`: lo decide el usuario arrastrando.
 *
 * Lo que no tiene el dato -sin autor, sin valorar- va al final en vez de
 * encabezar la grilla con huecos.
 */
export function ordenarLibros(books: readonly Book[], orden: Orden): Book[] {
  const copia = [...books];
  switch (orden) {
    case "manual":
      return copia;
    case "recientes":
      return copia.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    case "titulo":
      return copia.sort(porTitulo);
    case "autor":
      return copia.sort((a, b) => {
        if (a.author === null || b.author === null) {
          return a.author === b.author ? porTitulo(a, b) : a.author === null ? 1 : -1;
        }
        return collator.compare(a.author, b.author) || porTitulo(a, b);
      });
    case "valoracion":
      return copia.sort((a, b) => {
        if (a.rating === b.rating) return porTitulo(a, b);
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        return b.rating - a.rating;
      });
  }
}

/** Los años de lectura cargados, del más reciente al más viejo. */
export function aniosDeLectura(books: readonly Book[]): number[] {
  const anios = new Set<number>();
  books.forEach((b) => b.read_year !== null && anios.add(b.read_year));
  return [...anios].sort((a, b) => b - a);
}

/**
 * Aplica el orden nuevo de un subconjunto sin mover al resto.
 *
 * Con un filtro puesto se arrastra entre los libros visibles, pero lo que se
 * guarda es la biblioteca entera. Los visibles se reparten, en su orden
 * nuevo, en los mismos lugares que ya ocupaban; los ocultos no se mueven.
 * Así sacar el filtro no te reordena nada que no tocaste.
 */
export function reordenarSubconjunto(
  todos: readonly string[],
  visibles: readonly string[],
): string[] {
  const presentes = new Set(todos);
  const nuevos = visibles.filter((id) => presentes.has(id));
  const lugares = new Set(nuevos);
  let i = 0;
  return todos.map((id) => (lugares.has(id) ? nuevos[i++] : id));
}
