# Sistema visual "pertenencia" — Fase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el acento del módulo aparezca en todos los detalles de cada pantalla —nunca en fondos— con una forma más suave, de modo que las pantallas se vean con color aunque no haya nada urgente.

**Architecture:** El acento sigue siendo un único token `--accent` (la fase 2 lo hará variable por módulo). El cambio es dónde se usa: se invierte la regla de "el color marca urgencia" a "el color marca pertenencia". Se introduce un componente `IconChip` que envuelve todo ícono en un círculo con degradado del acento, y un test que impide que vuelvan a aparecer íconos sueltos.

**Tech Stack:** Next 16.2 App Router · React 19.2 · Tailwind v4 (CSS-first, sin archivo de config) · CVA · Phosphor Icons · motion · Vitest 4.1

## Global Constraints

- Tailwind v4 es **CSS-first**: no existe `tailwind.config.js`. Todo el theming vive en `app/globals.css` dentro de `@theme inline`.
- **Ningún componente hardcodea** color, radio, espaciado ni tamaño de fuente. Todo sale de un token.
- El color **nunca** va en fondos de pantalla. Fondo = `--paper`. Superficies = `--card`.
- `--danger` (`#a8503a`, terracota) queda reservado para lo destructivo. No se usa para "falta algo".
- Comentarios y nombres de variables **en español**, como el resto del repo.
- Todo cambio de estado se anima. Los presets viven en `lib/motion.ts`.
- La config de Vitest es `vitest.config.mts` (no `.ts`) y aliasea `server-only` a `node_modules/server-only/empty.js`.
- Objetivo de verificación por tarea: `pnpm build` sin errores de tipos, `pnpm lint` con 0 problemas, `pnpm test --run` en verde.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `app/globals.css` | **Modificar.** Regla de color nueva, utilidades de degradado, radios más generosos |
| `components/ui/icon-chip.tsx` | **Crear.** El chip redondo teñido. Firma visual del sistema |
| `lib/design/icon-usage.test.ts` | **Crear.** Impide que reaparezcan íconos sueltos |
| `components/ui/button.tsx` | **Modificar.** La variante `solid` pasa a degradado |
| `components/ui/tag.tsx` | **Modificar.** `accent` = reclama, `wash` = pertenece; se elimina `quiet` |
| `components/hubby/module-card.tsx` | **Modificar.** Usa `IconChip`; el color deja de depender de `reclama` |
| `components/hubby/empty-state.tsx` | **Modificar.** El ícono entra en un chip |
| `components/hubby/stat-tile.tsx` | **Modificar.** El valor lleva el acento siempre |
| `components/hubby/list.tsx` | **Modificar.** El slot `leading` acomoda chips de 40px |
| `app/(app)/supermercado/pantry.tsx` | **Modificar.** Aplica la regla nueva |
| `app/(app)/libros/library.tsx` | **Modificar.** Aplica la regla nueva |
| `app/(app)/ajustes/page.tsx` | **Modificar.** Íconos en chips |

---

### Task 1: Tokens — la regla nueva, el degradado y los radios

**Files:**
- Modify: `app/globals.css:6-25` (comentario de la regla), `:59-60` (sombras), `:156-164` (radios), y el bloque `@utility` del final

**Interfaces:**
- Consumes: nada
- Produces: las utilidades `bg-accent-chip` y `bg-accent-gradient`, y los radios `--radius-lg: 1.375rem` / `--radius-xl: 1.75rem`

- [ ] **Step 1: Reemplazar el comentario de la regla de color**

En `app/globals.css`, reemplazar el bloque de comentario que empieza en la línea 6 (`Sistema visual de hubby`) y termina en la línea 25, por:

```css
/* ---------------------------------------------------------------------------
   Sistema visual de hubby
   ---------------------------------------------------------------------------
   LA REGLA DE COLOR:

       El color no marca urgencia: marca pertenencia.

       Cada detalle que es de este módulo lleva su color, siempre. La urgencia
       la marcan el peso y el relleno -sólido contra lavado-, no la presencia
       o ausencia de color.

   La versión anterior decía "el color marca lo que reclama atención", y eso lo
   volvía raro por construcción: si solo aparece cuando algo reclama atención,
   y casi nunca reclama nada, las pantallas quedan grises. Ese fue exactamente
   el reclamo que hundió los tres rediseños anteriores.

   El color va en los detalles -íconos, estrellas, focos, marcas- y NUNCA en el
   fondo de la pantalla. Los fondos teñidos se descartaron explícitamente.

   El terracota queda reservado para lo destructivo. No para "falta algo": que
   falte leche no es un error, es el estado normal del que trata la app.
--------------------------------------------------------------------------- */
```

- [ ] **Step 2: Ablandar las sombras**

Reemplazar las dos líneas de sombra en `:root` (líneas 59-60):

```css
  --shadow-card: 0 1px 2px rgb(27 28 25 / 0.03), 0 10px 30px rgb(27 28 25 / 0.05);
  --shadow-float: 0 4px 10px rgb(27 28 25 / 0.05), 0 20px 50px rgb(27 28 25 / 0.09);
```

- [ ] **Step 3: Agrandar los radios**

En `@theme inline`, reemplazar el bloque de forma:

```css
  /* --- Forma -------------------------------------------------------------
     Radios generosos: de acá sale lo "amigable". El chip del ícono es
     completamente redondo y es la pieza que más se repite en la app. */
  --radius-sm: 0.625rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.375rem;
  --radius-xl: 1.75rem;
```

- [ ] **Step 4: Agregar las dos utilidades de degradado**

Al final de `app/globals.css`, después de `@utility hairline-b`:

```css
/* Degradado del chip: la pieza más repetida del sistema. Muy lavado, porque
   detrás del chip siempre hay un ícono que tiene que leerse. */
@utility bg-accent-chip {
  background-image: linear-gradient(
    135deg,
    color-mix(in oklab, var(--accent), transparent 82%),
    color-mix(in oklab, var(--accent), transparent 93%)
  );
}

/* Degradado del botón primario y del contador. Sutil a propósito: si se nota
   que es un degradado, está mal calibrado. */
@utility bg-accent-gradient {
  background-image: linear-gradient(
    135deg,
    color-mix(in oklab, var(--accent), white 14%),
    var(--accent) 62%,
    color-mix(in oklab, var(--accent), black 7%)
  );
}
```

- [ ] **Step 5: Verificar que compila y que `color-mix` resuelve**

```bash
pnpm build
```
Expected: `✓ Compiled successfully`, sin errores de tipos.

```bash
pnpm dev
```
Abrir `http://localhost:3000/` y correr en la consola del navegador:

```js
const d = document.createElement("div");
d.className = "bg-accent-chip";
document.body.append(d);
getComputedStyle(d).backgroundImage;
```
Expected: una cadena `linear-gradient(...)` con dos colores resueltos en `oklab`, **no** la palabra `none` ni `color-mix(` sin resolver.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): el color marca pertenencia, no urgencia

Invierte la regla que hundió los tres rediseños anteriores. Suma las dos
utilidades de degradado y agranda los radios."
```

---

### Task 2: IconChip y el test que sostiene la regla

**Files:**
- Create: `components/ui/icon-chip.tsx`
- Create: `lib/design/icon-usage.test.ts`

**Interfaces:**
- Consumes: `bg-accent-chip` de Task 1
- Produces: `<IconChip icon={Icon} tone="wash" | "solid" | "onAccent" size="sm" | "md" | "lg" />`

- [ ] **Step 1: Escribir el test que va a fallar**

Crear `lib/design/icon-usage.test.ts`:

```ts
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
  "app/login/login-form.tsx:EyeIcon": "mostrar u ocultar la contraseña",
  "app/login/login-form.tsx:EyeSlashIcon": "mostrar u ocultar la contraseña",

  // Adentro de un botón, que ya lleva el acento: un chip ahí sería un círculo
  // teñido adentro de otra superficie teñida.
  "app/(app)/supermercado/pantry.tsx:PlusCircleIcon": "va adentro de un botón",
  "app/(app)/libros/library.tsx:PlusIcon": "va adentro de un botón",
  "app/login/login-form.tsx:SignInIcon": "va adentro de un botón",
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
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
pnpm test --run lib/design/icon-usage.test.ts
```
Expected: FAIL. Hoy el escaneo devuelve 23 pares y la lista tiene 16; sobran exactamente estos 7. Task 3 envuelve 5 y suma los 2 de portada a la lista, con lo que cierra en 18 + 5 = 23:

```
app/(app)/ajustes/page.tsx:MoonIcon
app/(app)/ajustes/page.tsx:SignOutIcon
app/(app)/ajustes/page.tsx:UserIcon
app/(app)/libros/book-editor.tsx:BookOpenIcon
app/(app)/libros/library.tsx:BookOpenIcon
app/(app)/page.tsx:GearIcon
app/(app)/page.tsx:ModIcon
```

- [ ] **Step 3: Crear el componente**

Crear `components/ui/icon-chip.tsx`:

```tsx
import type { Icon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Todo ícono de la app vive adentro de uno de estos.
 *
 * Es la pieza que más se repite y por eso es la firma visual del sistema: el
 * círculo teñido con el color del módulo es lo que hace que una pantalla se
 * vea "de Libros" o "de Supermercado" sin pintar un solo fondo.
 */
const chip = cva("grid shrink-0 place-items-center rounded-full", {
  variants: {
    tone: {
      /** Pertenece al módulo. Es el caso normal. */
      wash: "bg-accent-chip text-accent",
      /** Reclama atención: relleno sólido. */
      solid: "bg-accent-gradient text-accent-ink",
      /** Sobre una superficie que ya está teñida con el acento. */
      onAccent: "bg-white/15 text-accent-ink",
    },
    size: { sm: "size-8", md: "size-10", lg: "size-12" },
  },
  defaultVariants: { tone: "wash", size: "md" },
});

const TAMANO_ICONO = { sm: 16, md: 20, lg: 24 } as const;

export function IconChip({
  icon: IconComponent,
  tone,
  size = "md",
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof chip> & { icon: Icon; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn(chip({ tone, size }), className)} aria-hidden {...props}>
      <IconComponent size={TAMANO_ICONO[size]} />
    </span>
  );
}
```

- [ ] **Step 4: Confirmar que el test sigue fallando por los mismos 7**

```bash
pnpm test --run lib/design/icon-usage.test.ts
```
Expected: FAIL, con los mismos 7 pares de más. Crear el componente no cambia el escaneo: `IconChip` dibuja `<IconComponent />`, que no termina en `Icon` y por eso el regex no lo cuenta. Eso es a propósito — es lo que hace que envolver un ícono lo saque de la lista.

- [ ] **Step 5: Commit**

```bash
git add components/ui/icon-chip.tsx lib/design/icon-usage.test.ts
git commit -m "feat(ui): IconChip, la firma visual del sistema

Todo ícono va adentro de un círculo teñido con el acento del módulo. El
test enumera las excepciones para que no vuelvan a aparecer sueltos."
```

---

### Task 3: Envolver los íconos sueltos

**Files:**
- Modify: `components/hubby/empty-state.tsx`
- Modify: `app/(app)/page.tsx`
- Modify: `app/(app)/ajustes/page.tsx`
- Modify: `app/(app)/libros/library.tsx`
- Modify: `app/(app)/libros/book-editor.tsx`
- Modify: `lib/design/icon-usage.test.ts` (suma las dos líneas del marcador de portada)

`app/(app)/supermercado/pantry.tsx` y `app/login/login-form.tsx` **no se tocan en esta tarea**: todos sus íconos son afordancias de campo o van adentro de un botón, así que ya están contemplados en `SIN_CHIP`.

**Interfaces:**
- Consumes: `IconChip` de Task 2
- Produces: nada nuevo

- [ ] **Step 1: EmptyState — el ícono entra en un chip grande**

En `components/hubby/empty-state.tsx`, reemplazar la línea del ícono:

```tsx
      <IconComponent size={36} weight="light" className="text-ink-faint" />
```

por:

```tsx
      <IconChip icon={IconComponent} size="lg" className="mb-1" />
```

y cambiar los imports del encabezado:

```tsx
import type { Icon } from "@phosphor-icons/react";
import { IconChip } from "@/components/ui/icon-chip";
import { cn } from "@/lib/utils";
```

- [ ] **Step 2: Envolver los 7 íconos que quedan sueltos**

Son exactamente éstos, en cuatro archivos. En todos los casos se borran el `size` y el `className` de color que traían, porque el chip los define:

| Archivo | Ícono | Qué es | Reemplazo |
|---|---|---|---|
| `app/(app)/ajustes/page.tsx` | `UserIcon` | fila de cuenta | `<IconChip icon={UserIcon} size="sm" />` |
| `app/(app)/ajustes/page.tsx` | `MoonIcon` | fila de apariencia | `<IconChip icon={MoonIcon} size="sm" />` |
| `app/(app)/ajustes/page.tsx` | `SignOutIcon` | fila de cerrar sesión | `<IconChip icon={SignOutIcon} size="sm" />` |
| `app/(app)/page.tsx` | `GearIcon` | fila de Ajustes | `<IconChip icon={GearIcon} size="sm" />` |
| `app/(app)/page.tsx` | `ModIcon` | ícono del módulo | `<IconChip icon={ModIcon} />` |
| `app/(app)/libros/library.tsx` | `BookOpenIcon` | portada faltante | `<IconChip icon={BookOpenIcon} size="sm" />` |
| `app/(app)/libros/book-editor.tsx` | `BookOpenIcon` | portada faltante | `<IconChip icon={BookOpenIcon} size="sm" />` |

En los dos casos de portada faltante, el chip **reemplaza** al contenedor `bg-sand` que ya existía, no se mete adentro. Para `book-editor.tsx`:

```tsx
              <div className="bg-accent-chip grid h-[54px] w-9 shrink-0 place-items-center rounded-sm">
                <BookOpenIcon size={14} className="text-accent" />
              </div>
```

Ese es el único caso donde no se usa `IconChip`: el marcador de portada es rectangular, no circular, porque ocupa el lugar exacto de una tapa. Por eso `library.tsx:BookOpenIcon` y `book-editor.tsx:BookOpenIcon` **quedan en `SIN_CHIP`** con el motivo `"marcador de portada, es rectangular"`, y la lista pasa de 16 a 18 entradas.

Agregar esas dos líneas a `SIN_CHIP` en `lib/design/icon-usage.test.ts`:

```ts
  // El hueco de una portada tiene la forma de una tapa, no de un círculo.
  "app/(app)/libros/library.tsx:BookOpenIcon": "marcador de portada, es rectangular",
  "app/(app)/libros/book-editor.tsx:BookOpenIcon": "marcador de portada, es rectangular",
```

Con eso quedan 5 íconos realmente envueltos y 18 en la lista: 18 + 5 = 23, que es el total del escaneo.

Agregar en cada archivo modificado el import:

```tsx
import { IconChip } from "@/components/ui/icon-chip";
```

- [ ] **Step 3: Correr el test hasta que pase**

```bash
pnpm test --run lib/design/icon-usage.test.ts
```
Expected: PASS. Si falla, el mensaje dice exactamente qué archivo sobra o falta.

- [ ] **Step 4: Verificar que no se rompió nada**

```bash
pnpm build && pnpm lint && pnpm test --run
```
Expected: build `✓ Compiled successfully`, lint sin problemas, 12 tests en verde (11 previos + el nuevo).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(ui): todos los íconos adentro de un chip"
```

---

### Task 4: Sólido reclama, lavado pertenece

**Files:**
- Modify: `components/ui/button.tsx:22-31`
- Modify: `components/ui/tag.tsx:12-27`
- Modify: `components/hubby/stat-tile.tsx`

**Interfaces:**
- Consumes: `bg-accent-gradient` y `bg-accent-chip` de Task 1
- Produces: `Tag` sin la variante `quiet` — quien la usaba pasa a `wash`

- [ ] **Step 1: El botón primario lleva degradado**

En `components/ui/button.tsx`, reemplazar la variante `solid`:

```tsx
        /** La acción principal. Degradado del acento, sutil a propósito. */
        solid: "bg-accent-gradient text-accent-ink hover:brightness-105 rounded-full",
```

- [ ] **Step 2: Las etiquetas dejan de tener un estado sin color**

En `components/ui/tag.tsx`, reemplazar el bloque `variants.variant` completo:

```tsx
      variant: {
        /** Reclama atención: relleno sólido. */
        accent: "bg-accent text-accent-ink",
        /** Pertenece al módulo y está resuelto: lavado del acento. */
        wash: "bg-accent-wash text-accent",
      },
```

y cambiar el `defaultVariants` de `{ variant: "quiet" }` a `{ variant: "wash" }`.

Se elimina `quiet` a propósito: era el estado "dato neutro, sin urgencia" y es exactamente lo que dejaba las pantallas grises. Todo dato que pertenece al módulo lleva su color.

- [ ] **Step 3: Arreglar los call sites que usaban `quiet`**

```bash
grep -rn 'variant="quiet"' app components
```

Reemplazar cada aparición por `variant="wash"`.

- [ ] **Step 4: El checkbox marca en color, no en gris**

Éste es el arreglo con más impacto visual de toda la fase. En `components/ui/checkbox.tsx:24`, la marca de "hecho" se pinta con `bg-ink-faint` —gris— y el checkbox es el control principal de Supermercado. Es una causa concreta y verificable de que esa pantalla se viera monocromática.

Reemplazar:

```tsx
        "data-[state=checked]:border-transparent data-[state=checked]:bg-ink-faint",
```

por:

```tsx
        "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-gradient",
```

Confirmar que no quedaron otras marcas en gris:

```bash
grep -rn "bg-ink-faint\|text-ink-faint" components/ui
```
Expected: solo apariciones en texto secundario (`text-ink-faint`), ninguna en un estado activo o marcado.

- [ ] **Step 5: El StatTile lleva el acento siempre**

En `components/hubby/stat-tile.tsx`, reemplazar la línea del valor:

```tsx
      <span className="text-title1 display-tight tabular-nums">{value}</span>
```

por:

```tsx
      <span
        className={cn(
          "text-title1 display-tight tabular-nums",
          // El número es el dato del módulo, así que lleva su color aunque no
          // reclame nada. Sobre acento sólido ya es tinta clara.
          reclama ? "text-accent-ink" : "text-accent",
        )}
      >
        {value}
      </span>
```

- [ ] **Step 6: Verificar**

```bash
pnpm build && pnpm lint && pnpm test --run
```
Expected: build limpio, lint sin problemas, 12 tests en verde.

Además, abrir `http://localhost:3000/libros` y confirmar a ojo que **no queda ninguna etiqueta gris**: las de estado ahora son verdes lavadas o verdes sólidas.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): sólido reclama, lavado pertenece

Se elimina la variante gris de Tag y la marca del checkbox deja de ser
gris: eran las dos razones concretas de que Supermercado se viera
monocromático. El botón primario y el valor de StatTile toman el acento."
```

---

### Task 5: Las tarjetas del panel dejan de depender de la urgencia

**Files:**
- Modify: `components/hubby/module-card.tsx`
- Modify: `components/hubby/list.tsx:70-75`

**Interfaces:**
- Consumes: `IconChip` de Task 2, `bg-accent-gradient` de Task 1
- Produces: nada nuevo

- [ ] **Step 1: El chip y el contador toman el acento siempre**

En `components/hubby/module-card.tsx`, reemplazar el bloque del ícono y el contador (el `<div className="flex items-start justify-between gap-2">` completo):

```tsx
      <div className="flex items-start justify-between gap-2">
        <IconChip icon={IconComponent} tone={reclama ? "onAccent" : "wash"} />
        {/* El contador es el dato que te trae a la tarjeta. Lleva el color del
            módulo aunque la tarjeta esté en papel. */}
        {reclama && (
          <span className="text-title2 leading-none font-bold tabular-nums">
            {badge}
          </span>
        )}
      </div>
```

y reemplazar el import del ícono por:

```tsx
import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { IconChip } from "@/components/ui/icon-chip";
```

- [ ] **Step 2: La flecha diagonal toma el acento cuando está en papel**

En el mismo archivo, reemplazar el `className` del `ArrowUpRightIcon`:

```tsx
          className={cn(
            "mb-0.5 shrink-0 transition-transform duration-150",
            "group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            reclama ? "opacity-70" : "text-accent",
          )}
```

- [ ] **Step 3: El slot `leading` acomoda un chip de 40px**

En `components/hubby/list.tsx`, reemplazar el bloque del `leading`:

```tsx
      {leading && (
        <div className="flex shrink-0 items-center justify-center">
          {leading}
        </div>
      )}
```

y ajustar el inset del separador para que arranque después del chip:

```tsx
        leading ? "[--hairline-inset:4.75rem]" : "[--hairline-inset:1.25rem]",
```

- [ ] **Step 4: Verificar en el navegador, claro y oscuro**

```bash
pnpm dev
```

Abrir `http://localhost:3000/` y confirmar:
- Las tarjetas de módulo tienen un chip redondo con degradado, no un círculo plano.
- La tarjeta de Ajustes (en papel) también muestra color: chip teñido y flecha verde.
- Nada tiene fondo de pantalla teñido.

Cambiar a modo oscuro desde Ajustes y repetir la comprobación.

- [ ] **Step 5: Verificar que no se rompió nada**

```bash
pnpm build && pnpm lint && pnpm test --run
```
Expected: build limpio, lint sin problemas, 12 tests en verde.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): el panel muestra color aunque nada reclame atención"
```

---

## Verificación final de la fase

- [ ] **Ninguna pantalla tiene fondo teñido.** Recorrer `/`, `/supermercado`, `/libros`, `/ajustes` y confirmar que el fondo es `--paper` en todas.
- [ ] **Ninguna pantalla se ve gris.** Ésta es la prueba que importa, porque es el reclamo que hundió los tres intentos anteriores. En cada pantalla tiene que haber color visible sin que nada reclame atención: apagar todos los estados urgentes (marcar todo el súper como "en casa", ningún libro "en progreso") y confirmar que las pantallas siguen teniendo verde.
- [ ] **Modo oscuro.** Repetir las dos comprobaciones anteriores con el tema oscuro.
- [ ] **Móvil real.** Abrir la app en el iPhone y confirmar que los degradados de `color-mix` resuelven en Safari. Si aparecieran transparentes o negros, es que `color-mix(in oklab, ...)` no resolvió y hay que reemplazar las dos `@utility` por valores calculados a mano — el diseño ya contempla esa salida.
- [ ] `pnpm build && pnpm lint && pnpm test --run` en verde.

---

## Fuera de alcance de esta fase

- **Color por módulo y pantalla de Ajustes.** Es la fase 2: migración `module_settings`, derivación de los cinco valores del acento con `oklch(from ...)`, paleta curada de 6 y modo avanzado con hex. Se planifica cuando ésta aterrice, porque su trabajo es parametrizar los tokens que ésta estabiliza.
- **shadcn como generador de componentes.** Va después de la fase 2, por el mismo motivo.
- **Cambiar la tipografía.** Instrument Sans se queda.
