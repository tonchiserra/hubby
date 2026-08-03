"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { downloadMissing } from "./download";

/**
 * El acceso rápido a la descarga, arriba a la derecha del encabezado.
 *
 * Solo ícono: al lado del título compite con él, y una etiqueta ahí obligaría a
 * achicar el título o a partirlo en dos líneas. El botón de abajo de la lista sí
 * lleva texto, que es donde se explica qué hace.
 *
 * Recibe los nombres ya resueltos en el servidor en vez de los productos
 * enteros: es lo único que necesita, y así no cruza al cliente nada más.
 */
export function DownloadMissingButton({ names }: { names: string[] }) {
  return (
    <Button
      variant="soft"
      size="icon"
      onClick={() => downloadMissing(names)}
      aria-label={`Descargar los ${names.length} productos que faltan`}
      title="Descargar faltantes"
    >
      <DownloadSimpleIcon size={19} weight="bold" />
    </Button>
  );
}
