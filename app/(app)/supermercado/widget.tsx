import Link from "next/link";
import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import { ListRow } from "@/components/hubby/list";
import { Badge } from "@/components/ui/badge";
import { getSummary } from "./queries";

/**
 * Se renderiza dentro del Suspense del dashboard, así que puede tardar sin
 * bloquear al resto de los módulos.
 */
export async function SupermercadoWidget() {
  const { missing, total } = await getSummary();

  return (
    <Link href="/supermercado" className="block">
      <ListRow
        last
        interactive
        leading={<BasketIcon size={22} className="text-primary" />}
        label="Supermercado"
        detail={
          total === 0
            ? "Sin productos todavía"
            : missing === 0
              ? "No falta nada"
              : `${missing} para comprar`
        }
        trailing={
          missing > 0 ? <Badge variant="primary">{missing}</Badge> : undefined
        }
      />
    </Link>
  );
}
