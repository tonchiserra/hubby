import { describe, expect, it } from "vitest";
import {
  aniosDeLectura,
  filtrarLibros,
  ordenarLibros,
  reordenarSubconjunto,
  type Filtros,
} from "@/app/(app)/libros/grid";
import type { Book } from "@/lib/supabase/types";

let n = 0;
function libro(datos: Partial<Book>): Book {
  n++;
  return {
    id: `b${n}`,
    user_id: "u",
    title: `Libro ${n}`,
    author: null,
    year: null,
    cover_url: null,
    olid: null,
    status: "quiero",
    format: "libro",
    rating: null,
    read_year: null,
    position: n,
    created_at: `2026-01-${String(n).padStart(2, "0")}T12:00:00+00:00`,
    updated_at: `2026-01-${String(n).padStart(2, "0")}T12:00:00+00:00`,
    ...datos,
  };
}

const sinFiltros: Filtros = { anio: null, valoracion: "todas", texto: "" };
const titulos = (books: Book[]) => books.map((b) => b.title);

describe("filtrarLibros", () => {
  const rayuela = libro({ title: "Rayuela", author: "Julio Cortázar", rating: 5, read_year: 2025 });
  const ficciones = libro({ title: "Ficciones", author: "Jorge Luis Borges", rating: 4.5, read_year: 2026 });
  const detectives = libro({ title: "Los detectives salvajes", author: "Roberto Bolaño", rating: 3, read_year: 2026 });
  const pendiente = libro({ title: "La invención de Morel", author: "Adolfo Bioy Casares" });
  const todos = [rayuela, ficciones, detectives, pendiente];

  it("sin filtros deja todo", () => {
    expect(filtrarLibros(todos, sinFiltros)).toEqual(todos);
  });

  it("filtra por año de lectura", () => {
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, anio: 2026 }))).toEqual([
      "Ficciones",
      "Los detectives salvajes",
    ]);
  });

  it("5 estrellas es exactamente 5, y 4 o más incluye los medios puntos", () => {
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, valoracion: "5" }))).toEqual(["Rayuela"]);
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, valoracion: "4" }))).toEqual([
      "Rayuela",
      "Ficciones",
    ]);
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, valoracion: "3" }))).toHaveLength(3);
  });

  it("sin valorar es el que no tiene valoración, no el de cero", () => {
    const cero = libro({ title: "Malísimo", rating: 0 });
    expect(titulos(filtrarLibros([...todos, cero], { ...sinFiltros, valoracion: "sin" }))).toEqual([
      "La invención de Morel",
    ]);
  });

  it("el texto busca en título y autor, sin tildes ni mayúsculas", () => {
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, texto: "cortazar" }))).toEqual(["Rayuela"]);
    expect(titulos(filtrarLibros(todos, { ...sinFiltros, texto: "  INVENCION " }))).toEqual([
      "La invención de Morel",
    ]);
  });

  it("los filtros se suman", () => {
    expect(
      titulos(filtrarLibros(todos, { anio: 2026, valoracion: "4", texto: "" })),
    ).toEqual(["Ficciones"]);
  });
});

describe("ordenarLibros", () => {
  const a = libro({ title: "Zama", author: "Antonio Di Benedetto", rating: 4, created_at: "2026-03-01T10:00:00+00:00" });
  const b = libro({ title: "Ábaco", author: null, rating: null, created_at: "2026-05-01T10:00:00+00:00" });
  const c = libro({ title: "El túnel", author: "Ernesto Sabato", rating: 5, created_at: "2026-04-01T10:00:00+00:00" });
  const manual = [a, b, c];

  it("mi orden respeta el que llega, sin mutarlo", () => {
    const copia = [...manual];
    expect(ordenarLibros(manual, "manual")).toEqual(manual);
    ordenarLibros(manual, "titulo");
    expect(manual).toEqual(copia);
  });

  it("recién agregados va del último al primero", () => {
    expect(titulos(ordenarLibros(manual, "recientes"))).toEqual(["Ábaco", "El túnel", "Zama"]);
  });

  it("por título ignora la tilde", () => {
    expect(titulos(ordenarLibros(manual, "titulo"))).toEqual(["Ábaco", "El túnel", "Zama"]);
  });

  it("por autor manda al final al que no tiene", () => {
    expect(titulos(ordenarLibros(manual, "autor"))).toEqual(["Zama", "El túnel", "Ábaco"]);
  });

  it("mejor valorados primero, y los sin valorar al final", () => {
    expect(titulos(ordenarLibros(manual, "valoracion"))).toEqual(["El túnel", "Zama", "Ábaco"]);
  });

  it("en un empate de valoración desempata el título", () => {
    const x = libro({ title: "Beta", rating: 4 });
    const y = libro({ title: "Alfa", rating: 4 });
    expect(titulos(ordenarLibros([x, y], "valoracion"))).toEqual(["Alfa", "Beta"]);
  });
});

describe("aniosDeLectura", () => {
  it("devuelve los años cargados, sin repetir y del más nuevo al más viejo", () => {
    const books = [
      libro({ read_year: 2024 }),
      libro({ read_year: 2026 }),
      libro({ read_year: null }),
      libro({ read_year: 2024 }),
    ];
    expect(aniosDeLectura(books)).toEqual([2026, 2024]);
  });
});

describe("reordenarSubconjunto", () => {
  it("sin filtro, el orden nuevo es el que quedó", () => {
    expect(reordenarSubconjunto(["a", "b", "c"], ["c", "a", "b"])).toEqual(["c", "a", "b"]);
  });

  it("los visibles se reparten en sus lugares y los ocultos no se mueven", () => {
    // Visibles: a, c, e. Se arrastró la "e" al principio.
    expect(reordenarSubconjunto(["a", "b", "c", "d", "e"], ["e", "a", "c"])).toEqual([
      "e",
      "b",
      "a",
      "d",
      "c",
    ]);
  });

  it("ignora lo que ya no está en la biblioteca", () => {
    expect(reordenarSubconjunto(["a", "b"], ["x", "b", "a"])).toEqual(["b", "a"]);
  });
});
