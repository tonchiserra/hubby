import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { Library } from "./library";
import { getBooks } from "./queries";

export const metadata = { title: "Libros" };

export default async function LibrosPage() {
  const books = await getBooks();
  const leyendo = books.filter((b) => b.status === "leyendo").length;
  const anio = new Date().getFullYear();
  const esteAnio = books.filter((b) => b.read_year === anio).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("libros")}
        title="Libros"
        subtitle={
          books.length === 0
            ? "Sin libros todavía"
            : leyendo > 0
              ? `Leyendo ${leyendo} · ${esteAnio} este año`
              : `${esteAnio} este año · ${books.length} en total`
        }
      />
      <Library books={books} />
    </div>
  );
}
