import { PageHeader } from "@/components/hubby/page-header";
import { findModuleBySlug } from "@/lib/modules/registry";
import { accentVars } from "@/lib/modules/types";
import { moduleTitleTransition } from "@/lib/transition-names";
import { Pantry } from "./pantry";
import { getItems } from "./queries";

export const metadata = { title: "Supermercado" };

export default async function SupermercadoPage() {
  const items = await getItems();
  const missing = items.filter((i) => !i.active).length;

  // El módulo tiñe su pantalla entera con su color: acá se inyecta --accent y
  // todo lo que lo use debajo lo hereda, sin pasarlo por props.
  const modulo = findModuleBySlug("supermercado")!;

  return (
    <div className="flex flex-col gap-6" style={accentVars(modulo)}>
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
      />
      <Pantry items={items} />
    </div>
  );
}
