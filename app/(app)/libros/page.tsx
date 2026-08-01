import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { Library } from "./library";
import { getBooks } from "./queries";

export const metadata = { title: "Libros" };

export default async function LibrosPage() {
  const books = await getBooks();
  const anio = new Date().getFullYear();
  // El año se puede cargar en cualquier estado, así que "terminados" pide las
  // dos condiciones: algo que estás leyendo puede tener año y no cuenta.
  const esteAnio = books.filter(
    (b) => b.status === "leido" && b.read_year === anio,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("libros")}
        title="Libros"
        subtitle={
          books.length === 0
            ? "Sin libros todavía"
            : esteAnio === 0
              ? "Todavía no terminaste ningún libro este año"
              : `Terminaste ${esteAnio} ${esteAnio === 1 ? "libro" : "libros"} este año`
        }
      />
      <Library books={books} />
    </div>
  );
}
