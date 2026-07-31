import { PageHeader } from "@/components/hubby/page-header";
import { Pantry } from "./pantry";
import { getItems } from "./queries";

export const metadata = { title: "Supermercado" };

export default async function SupermercadoPage() {
  const items = await getItems();
  const missing = items.filter((i) => !i.active).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Supermercado"
        subtitle={
          items.length === 0
            ? "Sin productos todavía"
            : missing === 0
              ? `No falta nada · ${items.length} en casa`
              : `${missing} para comprar · ${items.length} en total`
        }
      />
      <Pantry items={items} />
    </div>
  );
}
