import "server-only";

/**
 * Búsqueda en Open Library.
 *
 * Es la primera dependencia externa de hubby, así que está tratada como algo
 * que puede fallar: hay timeout, nunca lanza, y devolver una lista vacía es un
 * resultado válido. La pantalla siempre deja cargar el libro a mano, así que si
 * la API está caída el módulo sigue funcionando, solo que con más tipeo.
 *
 * Sin clave y sin límite práctico. Docs: https://openlibrary.org/dev/docs/api/search
 */

const TIMEOUT_MS = 4000;
const RESULTADOS = 8;

export type BookResult = {
  olid: string;
  title: string;
  author: string | null;
  year: number | null;
  coverUrl: string | null;
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

export async function searchBooks(query: string): Promise<BookResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(RESULTADOS));
  // Pedir solo los campos que se usan: la respuesta completa es enorme.
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i");

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Los resultados de una búsqueda no cambian de un minuto a otro.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };

    return (data.docs ?? [])
      .filter((d): d is OpenLibraryDoc & { key: string; title: string } =>
        Boolean(d.key && d.title),
      )
      .map((d) => ({
        // key viene como "/works/OL123W"; solo interesa el identificador.
        olid: d.key.replace("/works/", ""),
        title: d.title,
        author: d.author_name?.[0] ?? null,
        year: d.first_publish_year ?? null,
        coverUrl: d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : null,
      }));
  } catch {
    // Timeout, red caída o JSON inesperado. Que no haya resultados es un estado
    // que la pantalla ya sabe manejar, y siempre queda la carga manual.
    return [];
  }
}
