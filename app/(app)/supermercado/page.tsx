import { PageHeader } from "@/components/hubby/page-header";
import { moduleTitleTransition } from "@/lib/transition-names";
import { DownloadMissingButton } from "./download-button";
import { Pantry } from "./pantry";
import { getItems } from "./queries";

export const metadata = { title: "Supermercado" };

export default async function SupermercadoPage() {
  const items = await getItems();
  const missingNames = items.filter((i) => !i.active).map((i) => i.name);
  const missing = missingNames.length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/" }}
        transitionName={moduleTitleTransition("supermercado")}
        title="Supermercado"
        subtitle={
          items.length === 0
            ? "Sin productos todavía"
            : missing === 0
              ? `No falta nada · ${items.length} en casa`
              : `${missing} para comprar · ${items.length} en total`
        }
        // Sin faltantes no hay archivo que bajar: el botón no aparece en vez de
        // quedar deshabilitado, que sería un control muerto al lado del título.
        action={
          missing > 0 ? <DownloadMissingButton names={missingNames} /> : undefined
        }
      />
      <Pantry items={items} />
    </div>
  );
}
