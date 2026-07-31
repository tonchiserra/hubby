# Panel ordenado por urgencia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el panel de hubby muestre el contenido real de cada módulo ordenado por urgencia, en vez de nombres de módulo con un contador.

**Architecture:** El panel pide un resumen barato a cada módulo, los espera en paralelo, los parte en "reclaman atención" y "callados", y recién entonces pinta. Ordenar antes de pintar es deliberado: el orden no se conoce hasta que llegaron todos los datos, así que transmitir cada widget por su cuenta haría que la lista se reacomode sola delante del usuario. La lógica de partición es una función pura y se testea con Vitest; el render se verifica en el navegador.

**Tech Stack:** Next 16.2 (App Router, Server Components), React 19.2, TypeScript 5.9, Tailwind v4, Supabase (`@supabase/ssr`), Vitest 4.1 (nuevo en este plan).

## Global Constraints

- El proyecto usa **pnpm**. Nunca `npm install`.
- `lib/modules/registry.ts` es **client-safe**: solo metadata, sin imports de servidor. Lo consume código de cliente y meter ahí un import de servidor arrastra `next/headers` al bundle del navegador y rompe el build.
- Todo archivo que consulte la base lleva `import "server-only";` como primera línea.
- Nunca filtrar por `user_id` en las consultas: la política RLS ya lo hace en la base.
- El texto de interfaz va en **español rioplatense** (voseo): "tocá", "deslizá", "agregá".
- Las animaciones usan los presets de `lib/motion.ts`. No definir duraciones a mano.
- Commits en español, en imperativo, sin tildes en el mensaje.
- Este plan **no toca la estética**: ni colores, ni tipografía, ni radios, ni `globals.css`. La dirección visual está bloqueada esperando referencias de Gonzalo. Se reutilizan las primitivas existentes tal como están.

---

### Task 1: Contrato del resumen y lógica de partición

Crea el tipo que cada módulo aporta al panel y la función pura que decide el orden. Incluye levantar Vitest, que hoy no existe en el proyecto: la lógica de orden es el único punto con reglas propias y merece una prueba real.

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/modules/summary.ts`
- Create: `lib/modules/summary.test.ts`
- Modify: `package.json` (agregar `test` a `scripts` y `vitest` a `devDependencies`)

**Interfaces:**
- Consumes: `ModuleDefinition` de `lib/modules/types.ts` (campos `id`, `slug`, `label`, `icon`, `description`).
- Produces:
  - `type ModuleSummary = { urgency: number; detail: string; preview: string[] }`
  - `type ModulePanelEntry = { module: ModuleDefinition; summary: ModuleSummary }`
  - `function partitionByUrgency(entries: ModulePanelEntry[]): { active: ModulePanelEntry[]; quiet: ModulePanelEntry[] }`

- [ ] **Step 1: Instalar Vitest**

```bash
pnpm add -D vitest@4
```

- [ ] **Step 2: Crear la configuración de Vitest**

Crear `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo lógica pura por ahora: sin DOM, sin jsdom.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Vite carga este archivo desde su ubicación real, así que import.meta.url
      // apunta a la carpeta del proyecto. Ojo: en next.config.ts NO se puede
      // hacer esto, porque Next lo compila a una ruta temporal y la resolución
      // de módulos se rompe. Son casos opuestos a propósito.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Agregar el script de test**

En `package.json`, dentro de `"scripts"`, agregar la línea:

```json
"test": "vitest run",
```

El bloque queda así:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "db:link": "supabase link",
  "db:push": "supabase db push",
  "db:types": "supabase gen types typescript --linked > lib/supabase/types.generated.ts"
}
```

- [ ] **Step 4: Escribir el test que falla**

Crear `lib/modules/summary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import { partitionByUrgency, type ModulePanelEntry } from "./summary";
import type { ModuleDefinition } from "./types";

function mod(id: string, label: string): ModuleDefinition {
  return { id, slug: id, label, icon: BasketIcon, description: "" };
}

function entry(id: string, label: string, urgency: number): ModulePanelEntry {
  return {
    module: mod(id, label),
    summary: { urgency, detail: "", preview: [] },
  };
}

describe("partitionByUrgency", () => {
  it("separa los que reclaman atención de los que están en cero", () => {
    const { active, quiet } = partitionByUrgency([
      entry("libros", "Libros", 0),
      entry("super", "Supermercado", 3),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["super"]);
    expect(quiet.map((e) => e.module.id)).toEqual(["libros"]);
  });

  it("ordena los activos por urgencia descendente", () => {
    const { active } = partitionByUrgency([
      entry("a", "A", 2),
      entry("b", "B", 9),
      entry("c", "C", 5),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["b", "c", "a"]);
  });

  it("desempata por etiqueta para que el orden no baile entre cargas", () => {
    const { active } = partitionByUrgency([
      entry("z", "Zapatos", 4),
      entry("a", "Agenda", 4),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["a", "z"]);
  });

  it("ordena los callados alfabéticamente, sin mirar la urgencia", () => {
    const { quiet } = partitionByUrgency([
      entry("z", "Zapatos", 0),
      entry("a", "Agenda", 0),
    ]);

    expect(quiet.map((e) => e.module.id)).toEqual(["a", "z"]);
  });

  it("no muta el array que recibe", () => {
    const entries = [entry("a", "A", 1), entry("b", "B", 9)];
    partitionByUrgency(entries);

    expect(entries.map((e) => e.module.id)).toEqual(["a", "b"]);
  });

  it("devuelve dos listas vacías si no hay módulos", () => {
    expect(partitionByUrgency([])).toEqual({ active: [], quiet: [] });
  });
});
```

- [ ] **Step 5: Correr el test y verificar que falla**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./summary"` o `partitionByUrgency is not a function`. El archivo todavía no existe.

- [ ] **Step 6: Implementar**

Crear `lib/modules/summary.ts`:

```ts
import type { ModuleDefinition } from "./types";

/**
 * Lo que cada módulo le aporta al panel. Es deliberadamente chico: el panel
 * espera todos los resúmenes antes de pintar, así que cada uno tiene que salir
 * de una consulta barata.
 */
export type ModuleSummary = {
  /**
   * Cuánto reclama atención el módulo. 0 = nada que hacer, y entonces se
   * colapsa a una línea callada. Números más altos suben en el panel.
   */
  urgency: number;
  /** Línea de estado bajo el nombre del módulo. */
  detail: string;
  /** Hasta tres ítems concretos. Vacío si al módulo no le aplica. */
  preview: string[];
};

export type ModulePanelEntry = {
  module: ModuleDefinition;
  summary: ModuleSummary;
};

/**
 * Parte los módulos en los que reclaman atención y los que no.
 *
 * El desempate por etiqueta importa: sin él, dos módulos con la misma urgencia
 * quedarían en el orden que devuelva Promise.all, que puede variar entre
 * cargas y haría bailar el panel sin motivo.
 */
export function partitionByUrgency(entries: ModulePanelEntry[]): {
  active: ModulePanelEntry[];
  quiet: ModulePanelEntry[];
} {
  const byLabel = (a: ModulePanelEntry, b: ModulePanelEntry) =>
    a.module.label.localeCompare(b.module.label, "es");

  // Se copia antes de ordenar: sort muta, y el llamador no espera eso.
  const active = entries
    .filter((e) => e.summary.urgency > 0)
    .sort((a, b) => b.summary.urgency - a.summary.urgency || byLabel(a, b));

  const quiet = entries.filter((e) => e.summary.urgency === 0).sort(byLabel);

  return { active, quiet };
}
```

- [ ] **Step 7: Correr el test y verificar que pasa**

Run: `pnpm test`
Expected: PASS — 6 tests en `lib/modules/summary.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml lib/modules/summary.ts lib/modules/summary.test.ts
git commit -m "feat(panel): contrato de resumen y particion por urgencia

Suma Vitest, que el proyecto no tenia. La particion es el unico punto del
panel con reglas propias -orden, desempate, no mutar- y merece prueba real;
el render se verifica en el navegador.

El desempate por etiqueta no es cosmetico: sin el, dos modulos con la misma
urgencia quedan en el orden que devuelva Promise.all, que puede variar entre
cargas y haria bailar el panel."
```

---

### Task 2: Resumen del módulo Supermercado

Reemplaza el `getSummary()` actual —que solo devuelve conteos— por uno que además trae los nombres de los primeros productos que faltan, que es lo que el panel va a mostrar.

**Files:**
- Create: `app/(app)/supermercado/summary.ts`
- Create: `lib/modules/build-summary.test.ts`
- Modify: `app/(app)/supermercado/queries.ts` (eliminar `getSummary`, que queda sin uso)
- Delete: `app/(app)/supermercado/widget.tsx`

**Interfaces:**
- Consumes: `ModuleSummary` de `lib/modules/summary.ts`; `createClient` de `@/lib/supabase/server`.
- Produces:
  - `function buildGrocerySummary(input: { missingNames: string[]; missingCount: number; total: number }): ModuleSummary` — pura, exportada desde `app/(app)/supermercado/summary.ts`.
  - `async function getGrocerySummary(): Promise<ModuleSummary>` — hace la consulta y delega en la anterior.

- [ ] **Step 1: Escribir el test que falla**

Crear `lib/modules/build-summary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildGrocerySummary } from "@/app/(app)/supermercado/summary";

describe("buildGrocerySummary", () => {
  it("queda en cero cuando no hay productos cargados", () => {
    const s = buildGrocerySummary({ missingNames: [], missingCount: 0, total: 0 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("Sin productos todavía");
    expect(s.preview).toEqual([]);
  });

  it("queda en cero cuando no falta nada", () => {
    const s = buildGrocerySummary({ missingNames: [], missingCount: 0, total: 12 });

    expect(s.urgency).toBe(0);
    expect(s.detail).toBe("No falta nada · 12 en casa");
  });

  it("usa la cantidad de faltantes como urgencia", () => {
    const s = buildGrocerySummary({
      missingNames: ["Leche", "Café"],
      missingCount: 2,
      total: 12,
    });

    expect(s.urgency).toBe(2);
    expect(s.detail).toBe("2 para comprar");
    expect(s.preview).toEqual(["Leche", "Café"]);
  });

  it("usa singular cuando falta uno solo", () => {
    const s = buildGrocerySummary({
      missingNames: ["Leche"],
      missingCount: 1,
      total: 12,
    });

    expect(s.detail).toBe("1 para comprar");
    expect(s.urgency).toBe(1);
  });

  it("la urgencia refleja el total de faltantes, no cuántos entran en el preview", () => {
    const s = buildGrocerySummary({
      missingNames: ["Aceite", "Café", "Leche"],
      missingCount: 9,
      total: 20,
    });

    expect(s.urgency).toBe(9);
    expect(s.preview).toHaveLength(3);
    expect(s.detail).toBe("9 para comprar");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "@/app/(app)/supermercado/summary"`.

- [ ] **Step 3: Implementar el resumen**

Crear `app/(app)/supermercado/summary.ts`:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ModuleSummary } from "@/lib/modules/summary";

/** Cuántos productos concretos muestra el panel antes de cortar. */
const PREVIEW_SIZE = 3;

/**
 * Parte pura: dado el conteo y los nombres, arma el resumen. Separada de la
 * consulta para poder probar las reglas sin base de datos.
 */
export function buildGrocerySummary({
  missingNames,
  missingCount,
  total,
}: {
  missingNames: string[];
  missingCount: number;
  total: number;
}): ModuleSummary {
  if (total === 0) {
    return { urgency: 0, detail: "Sin productos todavía", preview: [] };
  }

  if (missingCount === 0) {
    return { urgency: 0, detail: `No falta nada · ${total} en casa`, preview: [] };
  }

  // La urgencia es el total de faltantes, no el largo del preview: con nueve
  // faltantes el módulo tiene que pesar nueve aunque solo se muestren tres.
  return {
    urgency: missingCount,
    detail: `${missingCount} para comprar`,
    preview: missingNames,
  };
}

export async function getGrocerySummary(): Promise<ModuleSummary> {
  const supabase = await createClient();

  const [missing, all] = await Promise.all([
    // count: "exact" junto con limit devuelve el total de coincidencias y solo
    // las primeras filas: una sola ida y vuelta para el número y los nombres.
    supabase
      .from("grocery_items")
      .select("name", { count: "exact" })
      .eq("active", false)
      .order("name", { ascending: true })
      .limit(PREVIEW_SIZE),
    supabase.from("grocery_items").select("*", { count: "exact", head: true }),
  ]);

  if (missing.error || all.error) {
    throw new Error(
      `No se pudo leer el resumen del supermercado: ${
        missing.error?.message ?? all.error?.message
      }`,
    );
  }

  return buildGrocerySummary({
    missingNames: (missing.data ?? []).map((r) => r.name),
    missingCount: missing.count ?? 0,
    total: all.count ?? 0,
  });
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test`
Expected: PASS — 11 tests en total (6 de Task 1 + 5 nuevos).

- [ ] **Step 5: Eliminar el `getSummary` viejo**

En `app/(app)/supermercado/queries.ts`, borrar la función `getSummary` completa (líneas 24-35), incluyendo su bloque. El archivo queda solo con `getItems`.

- [ ] **Step 6: Eliminar el widget viejo**

```bash
git rm app/\(app\)/supermercado/widget.tsx
```

Ese componente buscaba sus propios datos y renderizaba su tarjeta. Con el nuevo contrato los datos llegan resueltos desde el panel, así que la tarjeta pasa a ser genérica.

- [ ] **Step 7: Verificar que no quedan referencias colgadas**

Run: `grep -rn "getGrocerySummary\|getSummary\|supermercado/widget" --include="*.ts" --include="*.tsx" app lib`
Expected: solo la definición en `app/(app)/supermercado/summary.ts`. Cualquier import de `getSummary` o de `widget` es una referencia rota que se arregla en la Task 4.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(supermercado): resumen con nombres de lo que falta

El panel pasa a mostrar productos concretos, asi que el resumen deja de ser
solo un contador. count exact junto con limit trae el total de coincidencias
y las primeras filas en una sola ida y vuelta.

La urgencia es el total de faltantes y no el largo del preview: con nueve
faltantes el modulo tiene que pesar nueve aunque solo se muestren tres.

Separa la parte pura -buildGrocerySummary- de la consulta para poder probar
las reglas sin base de datos."
```

---

### Task 3: Registro de resúmenes por módulo

Reemplaza `MODULE_WIDGETS` por un mapa de funciones que devuelven resúmenes. Mantiene la separación que ya existe: `registry.ts` client-safe, lo que toca la base solo del lado del servidor.

**Files:**
- Create: `lib/modules/summaries.ts`
- Delete: `lib/modules/widgets.tsx`

**Interfaces:**
- Consumes: `getGrocerySummary` de `app/(app)/supermercado/summary.ts`; `ModuleSummary` de `lib/modules/summary.ts`.
- Produces: `const MODULE_SUMMARIES: Record<string, () => Promise<ModuleSummary>>` — indexado por `ModuleDefinition.id`.

- [ ] **Step 1: Crear el registro**

Crear `lib/modules/summaries.ts`:

```ts
import "server-only";
import { getGrocerySummary } from "@/app/(app)/supermercado/summary";
import type { ModuleSummary } from "./summary";

/**
 * Resúmenes de cada módulo, indexados por `id`.
 *
 * Separado del registry a propósito: acá se importan funciones que consultan
 * la base, y `registry.ts` lo consume código de cliente. Mezclarlos arrastra
 * next/headers al bundle del navegador y el build falla — ya pasó una vez.
 *
 * Solo lo importa el panel, que es Server Component.
 */
export const MODULE_SUMMARIES: Record<string, () => Promise<ModuleSummary>> = {
  grocery_item: getGrocerySummary,
};
```

- [ ] **Step 2: Eliminar el registro de widgets**

```bash
git rm lib/modules/widgets.tsx
```

- [ ] **Step 3: Verificar que nada más lo importaba**

Run: `grep -rn "MODULE_WIDGETS\|modules/widgets" --include="*.ts" --include="*.tsx" app lib components`
Expected: solo `app/(app)/page.tsx`, que se reescribe en la Task 5. Si aparece otro archivo, hay que actualizarlo también.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(panel): registro de resumenes por modulo

Reemplaza MODULE_WIDGETS por un mapa de funciones que devuelven resumenes.
Mantiene la separacion que costo un error de build encontrar: registry.ts
sigue siendo client-safe y todo lo que toca la base queda del lado servidor."
```

---

### Task 4: La tarjeta muestra contenido concreto

Extiende `ModuleCard` para que liste los ítems del preview. Sin cambios de estética: mismos tokens, mismas primitivas.

**Files:**
- Modify: `components/hubby/module-card.tsx`

**Interfaces:**
- Consumes: `Badge` de `@/components/ui/badge`; `cn` de `@/lib/utils`; `Icon` de `@phosphor-icons/react`.
- Produces: `ModuleCard` con la prop nueva `preview?: string[]`. Las props existentes —`href`, `label`, `detail`, `icon`, `badge`, `className`— no cambian de firma.

- [ ] **Step 1: Agregar la prop y el render del preview**

Reemplazar el contenido completo de `components/hubby/module-card.tsx`:

```tsx
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Cada módulo del menú principal. En móvil ocupa el ancho completo y en
 * escritorio entra en una grilla de tres, así que el contenido se apoya arriba
 * y el pie queda alineado aunque los textos tengan distinto largo.
 *
 * `preview` lista ítems concretos del módulo -qué falta comprar, qué se está
 * leyendo- para que el panel se pueda revisar sin entrar a ningún módulo.
 */
export function ModuleCard({
  href,
  label,
  detail,
  icon: IconComponent,
  badge,
  preview,
  className,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: Icon;
  badge?: number;
  preview?: string[];
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-card group flex min-h-touch flex-col gap-3 rounded-md p-4",
        "transition-[transform,background-color] duration-150",
        "active:scale-[0.98] active:bg-fill-tertiary md:hover:bg-fill-tertiary",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconComponent size={26} className="text-primary" />
        {badge !== undefined && badge > 0 && (
          <Badge variant="primary" size="sm">
            {badge}
          </Badge>
        )}
      </div>

      {preview && preview.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {preview.map((item) => (
            <li key={item} className="text-subhead truncate">
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-headline truncate">{label}</p>
          {detail && (
            <p className="text-footnote text-muted-foreground truncate">
              {detail}
            </p>
          )}
        </div>
        <CaretRightIcon
          size={14}
          weight="bold"
          className="text-subtle-foreground mb-0.5 shrink-0"
        />
      </div>
    </Link>
  );
}
```

El `mt-auto` del pie es lo que mantiene alineados los nombres de módulo cuando en la grilla de escritorio una tarjeta tiene tres ítems de preview y la de al lado ninguno.

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build`
Expected: falla en `app/(app)/page.tsx` por el import de `MODULE_WIDGETS`, que se eliminó en la Task 3. Es esperado y se resuelve en la Task 5. El error **no** debe mencionar `module-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/hubby/module-card.tsx
git commit -m "feat(panel): la tarjeta de modulo lista items concretos

Suma la prop preview para que el panel se pueda revisar sin entrar a ningun
modulo. El mt-auto del pie mantiene alineados los nombres cuando en la
grilla de escritorio una tarjeta trae tres items y la de al lado ninguno."
```

---

### Task 5: El panel espera, ordena y pinta

Reescribe el panel para que pida todos los resúmenes en paralelo, los parta y renderice: los activos como grilla de tarjetas, los callados como una lista compacta al final.

**Files:**
- Modify: `app/(app)/page.tsx`

**Interfaces:**
- Consumes: `MODULES` de `@/lib/modules/registry`; `MODULE_SUMMARIES` de `@/lib/modules/summaries`; `partitionByUrgency` y `ModulePanelEntry` de `@/lib/modules/summary`; `ModuleCard`; `ListGroup` y `ListRow` de `@/components/hubby/list`; `PageHeader`; `EmptyState`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Reescribir el panel**

Reemplazar el contenido completo de `app/(app)/page.tsx`:

```tsx
import Link from "next/link";
import { GearIcon, SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/hubby/page-header";
import { ModuleCard } from "@/components/hubby/module-card";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { EmptyState } from "@/components/hubby/empty-state";
import { MODULES } from "@/lib/modules/registry";
import { MODULE_SUMMARIES } from "@/lib/modules/summaries";
import { partitionByUrgency, type ModulePanelEntry } from "@/lib/modules/summary";

/**
 * Se esperan todos los resúmenes antes de pintar, en vez de transmitir cada
 * módulo por su cuenta dentro de su propio Suspense.
 *
 * No es una simplificación: no se puede a la vez transmitir y ordenar por
 * urgencia, porque el orden no se conoce hasta que llegaron todos los datos.
 * Con streaming la lista se reacomodaría sola mientras el usuario la mira. La
 * latencia total no empeora: sigue siendo la de la consulta más lenta.
 */
async function loadEntries(): Promise<ModulePanelEntry[]> {
  const withSummary = MODULES.filter((m) => MODULE_SUMMARIES[m.id]);

  return Promise.all(
    withSummary.map(async (mod) => ({
      module: mod,
      summary: await MODULE_SUMMARIES[mod.id](),
    })),
  );
}

export default async function Dashboard() {
  const { active, quiet } = partitionByUrgency(await loadEntries());
  const hayModulos = active.length > 0 || quiet.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Hubby" subtitle="Todo en un solo lugar" />

      {!hayModulos ? (
        <EmptyState
          icon={SquaresFourIcon}
          title="Todavía no hay módulos"
          description="Cuando registres uno, aparece acá automáticamente."
        />
      ) : (
        <>
          {active.length > 0 && (
            // Una columna en móvil, tres en escritorio.
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {active.map(({ module: mod, summary }) => (
                <ModuleCard
                  key={mod.id}
                  href={`/${mod.slug}`}
                  icon={mod.icon}
                  label={mod.label}
                  detail={summary.detail}
                  badge={summary.urgency}
                  preview={summary.preview}
                />
              ))}
            </div>
          )}

          {/* Lo resuelto se colapsa a una línea: con varios módulos, los que no
              piden nada dejan de competir por la atención. */}
          {quiet.length > 0 && (
            <ListGroup title="Al día">
              {quiet.map(({ module: mod, summary }, i) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.id} href={`/${mod.slug}`} className="block">
                    <ListRow
                      last={i === quiet.length - 1}
                      interactive
                      leading={<ModIcon size={22} className="text-primary" />}
                      label={mod.label}
                      detail={summary.detail}
                    />
                  </Link>
                );
              })}
            </ListGroup>
          )}

          <ListGroup>
            <Link href="/ajustes" className="block">
              <ListRow
                last
                interactive
                leading={<GearIcon size={22} className="text-primary" />}
                label="Ajustes"
                detail="Cuenta y apariencia"
              />
            </Link>
          </ListGroup>
        </>
      )}
    </div>
  );
}
```

Dos detalles que importan:

- El ícono se asigna a `ModIcon` antes de usarlo. JSX trata las etiquetas en minúscula como elementos HTML, así que `<mod.icon />` funcionaría por ser expresión de miembro, pero una constante en mayúscula deja la intención explícita y evita el error si alguien luego destructura el campo.
- Ajustes va en su propia fila y no en la grilla: no tiene urgencia ni preview, y mezclarlo con módulos que sí reclaman atención lo haría competir visualmente sin motivo.

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build`
Expected: `✓ Compiled successfully`, y en la tabla de rutas `/` aparece como `ƒ` (dinámica).

- [ ] **Step 3: Correr los tests**

Run: `pnpm test`
Expected: PASS — 11 tests.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/page.tsx"
git commit -m "feat(panel): espera los resumenes, ordena y pinta una sola vez

El panel pasa de lanzador a panel: muestra los productos que faltan por su
nombre en vez de un contador, ordenados por urgencia, y colapsa a una linea
los modulos que no piden nada.

Se esperan todos los resumenes antes de pintar en vez de transmitir cada uno
en su Suspense. No es una simplificacion: no se puede a la vez transmitir y
ordenar por urgencia, porque el orden no se conoce hasta que llegaron todos
los datos, y con streaming la lista se reacomodaria sola delante del usuario.
La latencia total no empeora."
```

---

### Task 6: Verificación en los tres estados

El orden y el colapso solo se pueden comprobar con datos reales. Se recorren los tres estados del supermercado moviendo productos desde la app.

**Files:** ninguno. Es verificación.

**Interfaces:** ninguna.

- [ ] **Step 1: Levantar la app**

```bash
pnpm build && pnpm start --port 3211
```

Entrar a `http://localhost:3211/login` con `test@hubby.com` / `test1234`.

> Si Gonzalo ya borró el usuario de prueba, usar el suyo. Si aparece **HTTP 431**, borrar las cookies de `localhost` en DevTools → Application → Cookies: las cookies no se aíslan por puerto y se acumulan entre proyectos.

- [ ] **Step 2: Estado "faltan cosas"**

En `/supermercado`, dejar al menos tres productos marcados como que faltan. Volver a `/`.

Expected:
- Supermercado aparece como tarjeta en la grilla.
- Lista hasta tres nombres concretos de productos.
- El badge muestra el total de faltantes.
- El detalle dice `N para comprar`.

- [ ] **Step 3: Estado "al día"**

En `/supermercado`, tocar **Ya compré todo**. Volver a `/`.

Expected:
- Supermercado desaparece de la grilla y baja al grupo **Al día**.
- Ahí se ve como una sola fila con `No falta nada · N en casa`.
- La fila navega a `/supermercado` al tocarla.

- [ ] **Step 4: Estado "sin productos"**

Borrar todos los productos deslizando cada fila. Volver a `/`.

Expected: Supermercado sigue en **Al día**, con el detalle `Sin productos todavía`.

- [ ] **Step 5: Verificar que no se reacomoda después de pintar**

En `/`, recargar con la red limitada a **Slow 4G** desde DevTools → Network.

Expected: la lista aparece ya ordenada, de una sola vez. **No** debe verse ningún módulo aparecer primero y correrse de lugar después. Ese salto es exactamente lo que evita esperar antes de pintar.

- [ ] **Step 6: Verificar escritorio**

Emular un viewport de 1280 px.

Expected: la grilla pasa a tres columnas y los nombres de módulo quedan alineados entre tarjetas aunque una tenga tres ítems de preview y otra ninguno.

- [ ] **Step 7: Restaurar los datos y bajar el servidor**

Volver a cargar algunos productos para dejar la app en un estado usable, y cortar el servidor:

```bash
kill $(lsof -ti:3211)
```

- [ ] **Step 8: Commit de cierre**

Si algún paso obligó a un ajuste, commitearlo. Si no hubo cambios, no hay commit: la verificación no genera artefactos.

---

## Fuera de alcance

- **La estética.** Colores, tipografía, radios, espaciados y `globals.css` no se tocan. La dirección visual está bloqueada esperando las referencias de Gonzalo, y proponer estética antes de tenerlas es exactamente lo que produjo dos rediseños descartados.
- **Componentes de panel a medida por módulo.** Hoy todos los módulos usan la misma tarjeta genérica alimentada por `ModuleSummary`. Cuando un módulo necesite una vista propia —un gráfico de trading, por ejemplo— se agrega ahí y el contrato no cambia. Con un solo módulo, construirlo ahora sería adivinar.
- **La UX del resto de la app.** La navegación de pila, el modelo de inventario y los gestos de swipe se conservan.
