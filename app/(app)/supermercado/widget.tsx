import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import { ModuleCard } from "@/components/hubby/module-card";
import { getSummary } from "./queries";

/**
 * Se renderiza dentro del Suspense del menú principal, así que puede tardar sin
 * bloquear al resto de los módulos.
 */
export async function SupermercadoWidget() {
  const { missing, total } = await getSummary();

  return (
    <ModuleCard
      href="/supermercado"
      icon={BasketIcon}
      label="Supermercado"
      badge={missing}
      detail={
        total === 0
          ? "Sin productos todavía"
          : missing === 0
            ? "No falta nada"
            : `${missing} para comprar`
      }
    />
  );
}
