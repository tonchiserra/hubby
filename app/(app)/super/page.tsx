import { PageHeader } from "@/components/hubby/page-header";
import { GroceryList } from "./grocery-list";
import { getGroceryItems } from "./queries";

export const metadata = { title: "Lista del súper" };

export default async function SuperPage() {
  const items = await getGroceryItems();
  const pending = items.filter((i) => !i.done).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Súper"
        subtitle={
          items.length === 0
            ? "Nada anotado"
            : `${pending} de ${items.length} pendiente${pending === 1 ? "" : "s"}`
        }
      />
      <GroceryList items={items} />
    </div>
  );
}
