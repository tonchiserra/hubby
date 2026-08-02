import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { Wishlist } from "./wishlist";
import { getWishes } from "./queries";
import { formatPrice } from "./money";

export const metadata = { title: "Deseos" };

export default async function DeseosPage() {
  const wishes = await getWishes();

  const pendientes = wishes.filter((w) => w.status !== "comprado");
  // Lo que costaría comprar todo lo que todavía querés. Solo suma lo que tiene
  // precio cargado, así que es un piso, no un total exacto.
  const total = pendientes.reduce((acc, w) => acc + (w.price ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("deseos")}
        title="Deseos"
        subtitle={
          wishes.length === 0
            ? "Sin deseos todavía"
            : pendientes.length === 0
              ? "Ya te compraste todo"
              : `${pendientes.length} en la lista${total > 0 ? ` · ${formatPrice(total)}` : ""}`
        }
      />
      <Wishlist wishes={wishes} />
    </div>
  );
}
