"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/hubby/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Red de contención de cualquier pantalla de módulo.
 *
 * Sin esto, un error de servidor -una migración sin correr, por ejemplo- deja
 * la pantalla de error de Next: en producción, un cartel genérico y, sobre
 * todo, un callejón sin salida. Como la app no tiene toolbar ni sidebar, la
 * única forma de volver al panel sería escribir la URL a mano.
 *
 * El mensaje crudo no se muestra en pantalla: puede filtrar nombres de tablas
 * y de columnas. Va a la consola, que es donde sirve.
 */
export default function ErrorDeModulo({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[módulo] la pantalla falló", error);
  }, [error]);

  return (
    <EmptyState
      icon={WarningIcon}
      title="Esta pantalla no cargó"
      description="El resto de la app sigue funcionando. Si vuelve a pasar, puede que falte correr una migración."
      action={
        <div className="flex items-center gap-2">
          <Button onClick={reset}>Reintentar</Button>
          <Button asChild variant="soft">
            <Link href="/">Volver al menú</Link>
          </Button>
        </div>
      }
    />
  );
}
