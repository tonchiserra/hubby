/**
 * Bajar los faltantes como .txt.
 *
 * Vive aparte de la pantalla porque lo usan dos botones: el ícono del
 * encabezado y el de abajo de la lista. Son dos accesos a la misma acción -uno
 * siempre a mano, otro donde terminás de leer la lista- y tienen que producir
 * exactamente el mismo archivo.
 */

/** Fecha en formato de archivo: 2026-08-03, que ordena solo por nombre. */
const stamp = (d: Date) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");

/**
 * El contenido del .txt. Un ítem por línea con un guión adelante, para que se
 * pueda ir tachando a mano en el papel o en el bloc de notas del teléfono.
 */
export function buildList(names: string[], now: Date): string {
  const fecha = now.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return [`Supermercado — ${fecha}`, "", ...names.map((n) => `- ${n}`), ""].join(
    "\n",
  );
}

function downloadTxt(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // Tiene que estar en el documento para que el click cuente como gesto en
  // Firefox, y la URL se libera un tick después: revocarla en el mismo turno
  // llega a cancelar la descarga en Safari.
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Descarga sin servidor: el archivo se arma con lo que ya está en pantalla, así
 * que no hay ida y vuelta ni una ruta nueva que mantener.
 */
export function downloadMissing(names: string[]) {
  if (names.length === 0) return;
  const now = new Date();
  downloadTxt(buildList(names, now), `supermercado-${stamp(now)}.txt`);
}
