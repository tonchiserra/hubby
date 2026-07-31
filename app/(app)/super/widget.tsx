import Link from "next/link";
import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr";
import { ListRow } from "@/components/hubby/list";
import { Badge } from "@/components/ui/badge";
import { getGrocerySummary } from "./queries";

/**
 * Se renderiza dentro del Suspense del dashboard, así que puede tardar sin
 * bloquear al resto de los módulos.
 */
export async function GroceryWidget() {
  const { pending, total } = await getGrocerySummary();

  return (
    <Link href="/super" className="block">
      <ListRow
        interactive
        leading={<ShoppingCartIcon size={22} className="text-primary" />}
        label="Lista del súper"
        detail={
          total === 0
            ? "Sin ítems todavía"
            : pending === 0
              ? "Todo comprado"
              : `${pending} pendiente${pending === 1 ? "" : "s"}`
        }
        trailing={
          pending > 0 ? <Badge variant="accent">{pending}</Badge> : undefined
        }
      />
    </Link>
  );
}
