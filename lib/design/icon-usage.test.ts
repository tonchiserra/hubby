import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();

/**
 * La regla del sistema visual dice que todo ícono va adentro de un IconChip.
 * Acá se enumeran las excepciones deliberadas, con el motivo.
 *
 * La clave es `ruta:NombreDelIcono`, no solo la ruta. Si fuera por archivo, el
 * primer ícono legítimo de una pantalla -la lupa del buscador, por ejemplo-
 * dejaría al resto de esa pantalla sin vigilancia.
 *
 * El test no mira cómo se ve nada: mira que la lista sea exactamente ésta. Un
 * ícono suelto nuevo falla y obliga a envolverlo o a justificarlo acá.
 */
const SIN_CHIP: Record<string, string> = {
  // Afordancias de navegación: dicen "acá se toca", no "esto es de tal módulo".
  "components/hubby/list.tsx:CaretRightIcon": "afordancia de navegación",
  "components/hubby/page-header.tsx:ArrowLeftIcon": "afordancia de navegación",
  "components/hubby/module-card.tsx:ArrowUpRightIcon": "afordancia de navegación",
  "app/(app)/deseos/wishlist.tsx:ArrowSquareOutIcon": "afordancia de navegación, sale de la app",

  // Íconos que son el dato o el estado de su propio control.
  "components/ui/star-rating.tsx:StarIcon": "las estrellas son el dato",
  "components/ui/checkbox.tsx:CheckIcon": "la marca vive adentro de la caja",
  "components/theme-toggle.tsx:SunIcon": "es el estado del control",
  "components/theme-toggle.tsx:MoonIcon": "es el estado del control",

  // Afordancias de campo: viven pegadas a un input.
  "app/(app)/supermercado/pantry.tsx:MagnifyingGlassIcon": "afordancia del campo",
  "app/(app)/supermercado/pantry.tsx:XCircleIcon": "limpiar el campo",
  "app/(app)/libros/library.tsx:MagnifyingGlassIcon": "afordancia del campo",
  "app/(app)/libros/library.tsx:XCircleIcon": "limpiar el campo",
  "app/(app)/deseos/wishlist.tsx:MagnifyingGlassIcon": "afordancia del campo",
  "app/(app)/deseos/wishlist.tsx:XCircleIcon": "limpiar el campo",
  "app/login/login-form.tsx:EyeIcon": "mostrar u ocultar la contraseña",
  "app/login/login-form.tsx:EyeSlashIcon": "mostrar u ocultar la contraseña",

  // Adentro de un botón, que ya lleva el acento: un chip ahí sería un círculo
  // teñido adentro de otra superficie teñida.
  "app/(app)/supermercado/pantry.tsx:PlusCircleIcon": "va adentro de un botón",
  "app/(app)/supermercado/pantry.tsx:DownloadSimpleIcon": "va adentro de un botón",
  "app/(app)/supermercado/download-button.tsx:DownloadSimpleIcon":
    "va adentro de un botón",
  "app/(app)/libros/library.tsx:PlusIcon": "va adentro de un botón",
  "app/(app)/deseos/wishlist.tsx:PlusCircleIcon": "va adentro de un botón",
  "app/login/login-form.tsx:SignInIcon": "va adentro de un botón",
  "app/(app)/ajustes/page.tsx:SignOutIcon": "va adentro de un botón destructivo",

  // El hueco de una portada tiene la forma de una tapa, no de un círculo.
  "app/(app)/libros/library.tsx:BookOpenIcon": "marcador de portada, es rectangular",
  "app/(app)/libros/book-editor.tsx:BookOpenIcon": "marcador de portada, es rectangular",
};

function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) return tsx(ruta);
    return ruta.endsWith(".tsx") ? [ruta] : [];
  });
}

describe("uso de íconos", () => {
  it("todo ícono nuevo pasa por IconChip", () => {
    const sueltos = [...tsx(join(RAIZ, "app")), ...tsx(join(RAIZ, "components"))]
      .flatMap((ruta) => {
        const fuente = readFileSync(ruta, "utf8");
        const nombres = [...fuente.matchAll(/<([A-Z]\w*Icon)\b/g)].map((m) => m[1]);
        return [...new Set(nombres)].map(
          (nombre) => `${relative(RAIZ, ruta)}:${nombre}`,
        );
      })
      .sort();

    expect(sueltos).toEqual(Object.keys(SIN_CHIP).sort());
  });
});
