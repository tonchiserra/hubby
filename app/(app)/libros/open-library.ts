/**
 * Búsqueda en Open Library, directo desde el navegador.
 *
 * Antes pasaba por una Server Action para poder cachear la respuesta. No valía
 * la pena: la API tarda ~1,1s por su cuenta y el salto por nuestro servidor le
 * sumaba encima, sin que el caché ayudara —cada tecla es una consulta distinta.
 * Open Library manda `access-control-allow-origin: *`, así que se puede pedir
 * directo.
 *
 * Es una dependencia externa, así que está tratada como algo que puede fallar:
 * nunca lanza, y devolver vacío es un resultado válido que la pantalla maneja.
 * La carga manual siempre está disponible.
 */

const TIMEOUT_MS = 6000;
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

export async function searchBooks(
  query: string,
  signal?: AbortSignal,
): Promise<BookResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(RESULTADOS));
  // Pedir solo los campos que se usan: la respuesta completa es enorme y es
  // buena parte de por qué la consulta tarda.
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i");

  try {
    const res = await fetch(url, {
      signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { docs?: OpenLibraryDoc[] };

    return (data.docs ?? [])
      .filter((d): d is OpenLibraryDoc & { key: string; title: string } =>
        Boolean(d.key && d.title),
      )
      .map((d) => ({
        olid: d.key.replace("/works/", ""),
        title: d.title,
        author: d.author_name?.[0] ?? null,
        year: d.first_publish_year ?? null,
        coverUrl: d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : null,
      }));
  } catch {
    // Abortada, timeout, red caída o JSON inesperado.
    return [];
  }
}
