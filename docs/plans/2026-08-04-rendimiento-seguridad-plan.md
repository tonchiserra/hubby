# Rendimiento y seguridad: plan de implementación

> **Para quien lo ejecute:** los pasos usan checkbox (`- [ ]`) para ir marcando.
> Cada tarea termina en un commit que se puede revertir solo.

**Goal:** Sacar el viaje de red de auth de cada request, bajar el panel de nueve
consultas a dos, poner cabeceras de seguridad y cerrar el open redirect del
login — sin tocar ningún módulo ni la UX.

**Architecture:** Los contadores del panel pasan a una función de Postgres que
devuelve números crudos; las reglas siguen en los `build*Summary` de TypeScript
y sus tests no se tocan. La sesión se verifica localmente contra el JWKS en vez
de contra el servidor de Auth. Las cabeceras se declaran en `next.config.ts`.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.4, Supabase
(`@supabase/ssr` 0.12.4, `@supabase/supabase-js` 2.111.0), Postgres, Vitest 4,
pnpm.

**Diseño de referencia:** [docs/plans/2026-08-04-rendimiento-seguridad-design.md](2026-08-04-rendimiento-seguridad-design.md)

## Global Constraints

- **pnpm siempre.** Nunca `npm install`.
- **Comentarios y documentación en español**, y explican *por qué*, no *qué*.
- **Commits en español, en imperativo, sin tildes**, con prefijo tipo
  `perf(panel):` / `fix(seguridad):` / `chore:`.
- **Nunca filtrar por `user_id` en las consultas.** La política RLS lo hace en
  la base; repetirlo da la falsa impresión de que la seguridad vive en el código.
- **Todo archivo que consulte la base lleva `import "server-only";` como primera
  línea.**
- `lib/supabase/types.ts` es el que importa la app y se edita a mano.
  `pnpm db:types` escribe `types.generated.ts`, que **no** lo reemplaza.
- **Una migración por cambio** en `supabase/migrations/`.
- `vitest.config.mts` solo incluye `lib/**/*.test.ts`. Un `*.test.ts` dentro de
  `app/` no lo corre nadie.
- Los tests existentes de resúmenes (`lib/modules/*.test.ts`) **no se tocan**.
  Si hubo que editarlos, la separación entre reglas puras y consultas se rompió.

## Desvío respecto del diseño

El diseño decía que la lectura de tareas pediría columnas explícitas en vez de
`*`. **Se saca del plan.** `list-editor.tsx` recibe `lista: TaskList` y
`tasks.tsx` usa `Task` en ocho firmas: angostar el `select` obliga a cambiar
tipos en los dos componentes cliente del módulo más delicado de la app, y ahorra
`user_id`, `created_at` y `updated_at` — unos 4 KB por lectura. El resto de ese
punto, colapsar los N updates de marcado en un RPC, sí entra (Tarea 3).

## Estructura de archivos

| Archivo | Responsabilidad |
| ------- | --------------- |
| `supabase/migrations/20260804120000_rendimiento_seguridad.sql` | **Crear.** RPCs del panel y de marcado, políticas RLS con `(select auth.uid())`, `with check` de `tasks`, trigger a invoker, índice del súper. |
| `lib/supabase/types.ts` | **Modificar.** Tipar las dos funciones nuevas y el shape `PanelCounters`. |
| `lib/modules/panel-counters.ts` | **Crear.** Una sola lectura de contadores por request, memoizada con `cache()`. |
| `app/(app)/supermercado/summary.ts` | **Modificar.** `getGrocerySummary` toma su pedazo de los contadores. La función pura no se toca. |
| `app/(app)/libros/summary.ts` | **Modificar.** Ídem. |
| `app/(app)/deseos/summary.ts` | **Modificar.** Ídem. |
| `app/(app)/tareas/queries.ts` | **Modificar.** N updates de marcado → un RPC. |
| `next.config.ts` | **Modificar.** `headers()` con CSP y compañía. |
| `app/(app)/libros/library.tsx` | **Modificar.** `referrerPolicy` en la portada. |
| `app/(app)/libros/book-editor.tsx` | **Modificar.** Ídem en la vista previa. |
| `lib/rutas.ts` | **Crear.** `rutaInterna()`, pura. |
| `lib/rutas.test.ts` | **Crear.** Sus tests. |
| `app/login/page.tsx` | **Modificar.** Validar el `?next=` del lado del servidor. |
| `app/login/login-form.tsx` | **Modificar.** Recibe una ruta ya validada. |
| `proxy.ts` | **Modificar.** `getUser()` → `getClaims()`. Va solo, al final. |
| `package.json` | **Modificar.** Sacar `konsta`. |

---

## Tarea 1: Migración de base de datos

Todo lo que va acá es invisible para la app: la migración crea funciones que
todavía nadie llama y reescribe políticas manteniendo el mismo efecto. Por eso
va primera — si algo sale mal, se nota antes de tocar una línea de TypeScript.

**Files:**
- Create: `supabase/migrations/20260804120000_rendimiento_seguridad.sql`
- Modify: `lib/supabase/types.ts`

**Interfaces:**
- Produces: `public.panel_resumen()` → `json` con el shape de `PanelCounters`;
  `public.marcar_reinicios(ids uuid[], marcas date[])` → `void`; el tipo
  exportado `PanelCounters` desde `@/lib/supabase/types`.

- [ ] **Step 1: Escribir la migración**

Crear `supabase/migrations/20260804120000_rendimiento_seguridad.sql`:

```sql
-- Rendimiento y seguridad sobre lo que ya hay. Nada de esto cambia lo que la
-- app muestra: son las mismas cuentas, hechas en menos viajes, y las mismas
-- reglas de acceso, evaluadas una vez por consulta en vez de una vez por fila.

-- ---------------------------------------------------------------------------
-- 1. Los contadores del panel, en una sola ida y vuelta.
-- ---------------------------------------------------------------------------

/**
 * Devuelve numeros crudos, no resumenes. Que significa cada numero -si el
 * modulo reclama atencion, que dice la linea de estado- lo siguen decidiendo
 * los build*Summary en TypeScript, que se prueban sin base de datos.
 *
 * Antes el panel hacia nueve consultas a PostgREST para pintar cuatro
 * tarjetas. Tareas queda afuera a proposito: su resumen tiene que aplicar los
 * reinicios vencidos y esa logica vive en TS.
 *
 * SECURITY INVOKER: corre con los permisos de quien llama, asi que RLS sigue
 * aplicando y nadie ve los contadores de otro.
 */
create or replace function public.panel_resumen()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with
  super_faltan as (
    select name
    from public.grocery_items
    where active = false
    order by name
    limit 3
  ),
  super_conteo as (
    select
      count(*) filter (where active = false) as faltan,
      count(*) as total
    from public.grocery_items
  ),
  libros_leyendo as (
    select title
    from public.books
    where status = 'leyendo'
    order by title
    limit 3
  ),
  libros_conteo as (
    select
      -- El anio se toma en la zona de la app y no en UTC, que es donde corre
      -- el servidor. El 31 de diciembre a la noche, en UTC ya es el anio que
      -- viene y los libros terminados dejarian de contar antes de tiempo.
      count(*) filter (
        where status = 'leido'
          and read_year = extract(
                year from (now() at time zone 'America/Argentina/Buenos_Aires')
              )::smallint
      ) as leidos_anio,
      count(*) as total
    from public.books
  ),
  deseos_proximos as (
    select title, price, created_at
    from public.wishes
    where status = 'proximo'
    order by created_at desc
    limit 3
  ),
  deseos_conteo as (
    select
      count(*) filter (where status = 'proximo') as proximos,
      count(*) filter (where status in ('quiero', 'proximo')) as pendientes,
      count(*) as total
    from public.wishes
  )
  select json_build_object(
    'grocery', json_build_object(
      -- coalesce a '[]' porque json_agg sobre cero filas devuelve null, y del
      -- otro lado se espera un arreglo siempre.
      'missing_names', coalesce(
        (select json_agg(name order by name) from super_faltan), '[]'::json
      ),
      'missing_count', (select faltan from super_conteo),
      'total',         (select total  from super_conteo)
    ),
    'books', json_build_object(
      'leyendo', coalesce(
        (select json_agg(title order by title) from libros_leyendo), '[]'::json
      ),
      'leidos_anio', (select leidos_anio from libros_conteo),
      'total',       (select total       from libros_conteo)
    ),
    'wishes', json_build_object(
      'proximos', coalesce(
        (
          select json_agg(
                   json_build_object('title', title, 'price', price)
                   order by created_at desc
                 )
          from deseos_proximos
        ),
        '[]'::json
      ),
      'proximos_count',   (select proximos   from deseos_conteo),
      'pendientes_count', (select pendientes from deseos_conteo),
      'total',            (select total      from deseos_conteo)
    )
  );
$$;

comment on function public.panel_resumen is
  'Contadores crudos del panel. Sin reglas: esas viven en los build*Summary.';

-- ---------------------------------------------------------------------------
-- 2. Marcar varios reinicios de una.
-- ---------------------------------------------------------------------------

/**
 * Cada lista guarda la fecha que le tocaba, no la de hoy, asi que las marcas
 * son distintas entre si y no se pueden resolver con un update plano. Antes se
 * mandaba un update por lista.
 *
 * Mismo patron que reorder_books: los dos arreglos vienen alineados por
 * posicion y unnest de dos argumentos los recorre en paralelo.
 */
create or replace function public.marcar_reinicios(ids uuid[], marcas date[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.task_lists l
  set last_reset_on = nuevo.marca
  from unnest(ids, marcas) as nuevo(id, marca)
  where l.id = nuevo.id;
$$;

comment on function public.marcar_reinicios is
  'Marca el reinicio aplicado de varias listas, cada una con la fecha que le tocaba.';

-- ---------------------------------------------------------------------------
-- 3. Politicas: auth.uid() una vez por consulta, no una por fila.
-- ---------------------------------------------------------------------------

-- Envuelto en (select ...) Postgres lo evalua como InitPlan, una sola vez.
-- Sin el parentesis se llama por cada fila examinada.

drop policy "grocery_items_owner" on public.grocery_items;
create policy "grocery_items_owner"
  on public.grocery_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "books_owner" on public.books;
create policy "books_owner"
  on public.books for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "wishes_owner" on public.wishes;
create policy "wishes_owner"
  on public.wishes for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "task_lists_owner" on public.task_lists;
create policy "task_lists_owner"
  on public.task_lists for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

/**
 * tasks lleva ademas la comprobacion de que list_id sea de una lista tuya.
 *
 * La foreign key solo garantiza que la lista exista, y addTask recibe el
 * list_id del cliente: sin esto se puede insertar una tarea propia colgando de
 * la lista de otro. Queda huerfana e invisible para los dos, pero es una fila
 * que no deberia poder escribirse.
 *
 * Va solo en `with check` y no en `using`: es una condicion de escritura, y
 * meterla en `using` encareceria todas las lecturas para cubrir un caso que
 * solo ocurre al insertar o mover una fila.
 */
drop policy "tasks_owner" on public.tasks;
create policy "tasks_owner"
  on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.task_lists l
      where l.id = list_id
        and l.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. El trigger de updated_at no necesita privilegios elevados.
-- ---------------------------------------------------------------------------

-- Setear una columna de la fila que se esta escribiendo lo puede hacer quien
-- ya tiene permiso de escribirla. SECURITY DEFINER solo agregaba superficie.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. El indice del super, alineado con el orden que la consulta pide.
-- ---------------------------------------------------------------------------

-- Estaba sobre lower(trim(name)) pero las consultas ordenan por name pelado,
-- asi que el indice no servia para el orden y Postgres ordenaba en memoria.
-- El indice unico sobre lower(trim(name)) sigue existiendo aparte: ese es el
-- que evita duplicados y no es este.
--
-- Se indexa (user_id, active, name) y no (user_id, name): la consulta que se
-- beneficia es la del panel, que filtra por active y corta en tres. La lectura
-- de la pantalla se trae el inventario entero, asi que ningun indice le evita
-- leer todas las filas.
drop index if exists public.grocery_items_user_active_name_idx;

create index grocery_items_user_active_name_idx
  on public.grocery_items (user_id, active, name);
```

- [ ] **Step 2: Aplicar la migración**

Requiere que el repo ya esté linkeado (`pnpm db:link`, una sola vez).

Run: `pnpm db:push`

Expected: la salida lista `20260804120000_rendimiento_seguridad.sql` y termina
sin error. Si dice que el proyecto no está linkeado, correr `pnpm db:link`
primero.

- [ ] **Step 3: Verificar que las funciones existen y devuelven algo**

Run: `pnpm exec supabase db push --dry-run`

Expected: `Remote database is up to date.` — o sea, no queda nada pendiente.

- [ ] **Step 4: Tipar las dos funciones nuevas**

En `lib/supabase/types.ts`, reemplazar el bloque `Functions` (que hoy solo tiene
`reorder_books`) por:

```ts
    Functions: {
      /** Reordena la biblioteca: los ids llegan en el orden nuevo. */
      reorder_books: {
        Args: { ids: string[] };
        Returns: undefined;
      };
      /** Los contadores del panel en una sola ida y vuelta. Sin reglas adentro. */
      panel_resumen: {
        Args: Record<never, never>;
        Returns: PanelCounters;
      };
      /** Marca el reinicio de varias listas, cada una con la fecha que le tocaba. */
      marcar_reinicios: {
        Args: { ids: string[]; marcas: string[] };
        Returns: undefined;
      };
    };
```

Y al final del archivo, junto a los otros alias, agregar:

```ts
/**
 * Lo que devuelve `panel_resumen()`: números y nombres, nada interpretado.
 *
 * Las claves están en snake_case porque son las de la función de Postgres y no
 * las de la app: renombrarlas acá escondería de dónde vienen.
 *
 * Tareas no está: su resumen tiene que aplicar los reinicios vencidos antes de
 * contar, y esa lógica vive en TypeScript.
 */
export type PanelCounters = {
  grocery: {
    missing_names: string[];
    missing_count: number;
    total: number;
  };
  books: {
    leyendo: string[];
    leidos_anio: number;
    total: number;
  };
  wishes: {
    proximos: { title: string; price: number | null }[];
    proximos_count: number;
    pendientes_count: number;
    total: number;
  };
};
```

- [ ] **Step 5: Verificar que compila**

Run: `pnpm exec tsc --noEmit`

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260804120000_rendimiento_seguridad.sql lib/supabase/types.ts
git commit -m "perf(db): los contadores del panel salen de una sola funcion

Agrega panel_resumen() y marcar_reinicios(), envuelve auth.uid() en un
select para que se evalue una vez por consulta y no por fila, valida en
tasks que list_id sea de una lista propia, baja set_updated_at a security
invoker y alinea el indice del super con el orden que la consulta pide.

Todavia no lo usa nadie: la app pasa a usarlo en el commit siguiente."
```

---

## Tarea 2: El panel usa una sola lectura

**Files:**
- Create: `lib/modules/panel-counters.ts`
- Modify: `app/(app)/supermercado/summary.ts` (solo `getGrocerySummary`)
- Modify: `app/(app)/libros/summary.ts` (solo `getBooksSummary`)
- Modify: `app/(app)/deseos/summary.ts` (solo `getWishesSummary`)

**Interfaces:**
- Consumes: `panel_resumen()` y `PanelCounters` de la Tarea 1.
- Produces: `getPanelCounters(): Promise<PanelCounters>` desde
  `@/lib/modules/panel-counters`.

**Lo que NO se toca:** `buildGrocerySummary`, `buildBooksSummary` y
`buildWishesSummary` quedan exactamente como están, con las mismas firmas. Sus
tests son la prueba de que así fue.

- [ ] **Step 1: Correr los tests para tener la línea de base**

Run: `pnpm test`

Expected: todos en verde. Anotar cuántos son — al final tienen que ser los
mismos y sin haberlos editado.

- [ ] **Step 2: Crear la lectura única**

Crear `lib/modules/panel-counters.ts`:

```ts
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PanelCounters } from "@/lib/supabase/types";

/**
 * Los contadores de supermercado, libros y deseos en una sola llamada.
 *
 * `cache()` de React memoiza por request: los tres resúmenes piden lo mismo y
 * tiene que viajar una sola vez. Sin esto volveríamos a tener tres consultas,
 * solo que ahora las tres serían la más cara.
 *
 * Si esto falla, las tres tarjetas se degradan juntas en vez de una sola. Es un
 * cambio consciente respecto de cuando cada módulo consultaba por su cuenta: lo
 * que `resumenAislado()` protege es que la home siga renderizando y se pueda
 * navegar, y eso se mantiene.
 */
export const getPanelCounters = cache(async (): Promise<PanelCounters> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("panel_resumen");

  if (error) {
    throw new Error(`No se pudieron leer los contadores del panel: ${error.message}`);
  }

  return data;
});
```

Si TypeScript se queja de que `rpc("panel_resumen")` necesita un segundo
argumento, pasarle `{}`: la función no toma parámetros y `Args` está declarado
como `Record<never, never>`.

- [ ] **Step 3: Supermercado toma su pedazo**

En `app/(app)/supermercado/summary.ts`:

Reemplazar el bloque de imports:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ModuleSummary } from "@/lib/modules/summary";
```

por:

```ts
import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";
```

Y reemplazar toda la función `getGrocerySummary` (desde
`export async function getGrocerySummary` hasta su llave de cierre) por:

```ts
export async function getGrocerySummary(): Promise<ModuleSummary> {
  const { grocery } = await getPanelCounters();

  return buildGrocerySummary({
    missingNames: grocery.missing_names,
    missingCount: grocery.missing_count,
    total: grocery.total,
  });
}
```

`buildGrocerySummary` y la constante `PREVIEW_SIZE` no se tocan. Si `PREVIEW_SIZE`
queda sin uso, borrarla: el corte a tres ahora lo hace el `limit 3` del SQL, y
una constante que no gobierna nada miente.

- [ ] **Step 4: Libros toma su pedazo**

En `app/(app)/libros/summary.ts`, reemplazar los imports:

```ts
import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";
```

Y reemplazar toda la función `getBooksSummary` por:

```ts
export async function getBooksSummary(): Promise<ModuleSummary> {
  // El año lo calcula la consulta, en la zona de la app. Antes salía de
  // `new Date().getFullYear()` sobre el reloj del servidor, que en Vercel es
  // UTC: el 31 de diciembre a la noche ya contaba el año siguiente.
  const { books } = await getPanelCounters();

  return buildBooksSummary({
    leyendo: books.leyendo,
    leidosEsteAnio: books.leidos_anio,
    total: books.total,
  });
}
```

- [ ] **Step 5: Deseos toma su pedazo**

En `app/(app)/deseos/summary.ts`, reemplazar los imports:

```ts
import "server-only";
import { getPanelCounters } from "@/lib/modules/panel-counters";
import type { ModuleSummary } from "@/lib/modules/summary";
import { formatPrice } from "./money";
```

Y reemplazar toda la función `getWishesSummary` por:

```ts
export async function getWishesSummary(): Promise<ModuleSummary> {
  const { wishes } = await getPanelCounters();

  return buildWishesSummary({
    proximos: wishes.proximos,
    proximosCount: wishes.proximos_count,
    pendientesCount: wishes.pendientes_count,
    total: wishes.total,
  });
}
```

Igual que en supermercado: si `PREVIEW_SIZE` queda sin uso, borrarla.

- [ ] **Step 6: Verificar que los tests siguen verdes sin haberlos tocado**

Run: `pnpm test`

Expected: la misma cantidad de tests que en el Step 1, todos en verde.

Run: `git diff --name-only lib/modules/`

Expected: **ningún archivo `*.test.ts` en la lista.** Si aparece uno, algo se
rompió en la separación y hay que revisar, no editar el test.

- [ ] **Step 7: Verificar tipos y lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: sin errores. Un import de `createClient` que quedó sin usar sale acá.

- [ ] **Step 8: Probarlo a mano**

Run: `pnpm dev`

Abrir `http://localhost:3000` y verificar que las cuatro tarjetas muestran los
mismos números y los mismos ítems del preview que antes del cambio.

Expected: el panel idéntico. Si alguna tarjeta dice "No se pudo cargar", mirar
el log del servidor: lo más probable es que la migración de la Tarea 1 no se
haya aplicado.

- [ ] **Step 9: Commit**

```bash
git add lib/modules/panel-counters.ts "app/(app)/supermercado/summary.ts" "app/(app)/libros/summary.ts" "app/(app)/deseos/summary.ts"
git commit -m "perf(panel): nueve consultas se vuelven una

Supermercado, libros y deseos toman sus contadores de panel_resumen(),
memoizado por request con cache() de React. Las reglas siguen donde
estaban: los build*Summary no cambiaron y sus tests tampoco.

De paso, los libros terminados del ano se cuentan en la zona de la app y
no en UTC, que es donde corre el servidor."
```

---

## Tarea 3: Un solo update para marcar los reinicios

**Files:**
- Modify: `app/(app)/tareas/queries.ts:80-98` (el bloque `const marcadas = ...`)

**Interfaces:**
- Consumes: `marcar_reinicios(ids, marcas)` de la Tarea 1.

- [ ] **Step 1: Reemplazar los N updates por el RPC**

En `app/(app)/tareas/queries.ts`, reemplazar este bloque:

```ts
  // Cada lista guarda la fecha que le tocaba, no la de hoy: una lista mensual
  // que se reinicia el 5 pero se abre el 20 tiene que quedar marcada el 5, o el
  // mes que viene el cálculo arranca corrido.
  const marcadas = await Promise.all(
    vencidas.map(({ lista, marca }) =>
      supabase
        .from("task_lists")
        .update({ last_reset_on: marca })
        .eq("id", lista.id),
    ),
  );

  const falla = marcadas.find((r) => r.error);
  if (falla?.error) {
    console.error("[tareas] no se pudo marcar el reinicio", falla.error);
  }
```

por:

```ts
  // Cada lista guarda la fecha que le tocaba, no la de hoy: una lista mensual
  // que se reinicia el 5 pero se abre el 20 tiene que quedar marcada el 5, o el
  // mes que viene el cálculo arranca corrido.
  //
  // Como cada marca es distinta, no alcanza con un update plano: van los dos
  // arreglos alineados por posición a una función de Postgres, en vez de una
  // request por lista.
  const { error: marcarError } = await supabase.rpc("marcar_reinicios", {
    ids,
    marcas: vencidas.map((v) => v.marca),
  });

  if (marcarError) {
    console.error("[tareas] no se pudo marcar el reinicio", marcarError);
  }
```

El `const ids` ya existe unas líneas más arriba y se reusa tal cual.

- [ ] **Step 2: Verificar tipos, lint y tests**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`

Expected: todo en verde.

- [ ] **Step 3: Probar el reinicio a mano**

Este es el camino que más importa que siga andando, y solo se ejercita cuando
hay un reinicio vencido. Para forzarlo:

1. `pnpm dev`, entrar a `/tareas`, crear una lista con reinicio semanal en un
   día que ya haya pasado esta semana y tildar alguna tarea.
2. En el editor de tablas de Supabase, poner a mano `last_reset_on` de esa lista
   en una fecha anterior a ese día.
3. Recargar `/tareas`.

Expected: las tareas aparecen destildadas y `last_reset_on` quedó en la fecha
que tocaba (el día de la semana elegido), **no** en la de hoy. Ese último punto
es todo el objetivo del RPC.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/tareas/queries.ts"
git commit -m "perf(tareas): marcar los reinicios en una sola escritura

Cada lista guarda una fecha distinta -la que le tocaba- asi que no se
podia resolver con un update plano y se mandaba uno por lista. Ahora van
los dos arreglos a marcar_reinicios(), mismo patron que reorder_books."
```

---

## Tarea 4: Cabeceras de seguridad

**Files:**
- Modify: `next.config.ts`
- Modify: `app/(app)/libros/library.tsx:516-529`
- Modify: `app/(app)/libros/book-editor.tsx:139-143`

- [ ] **Step 1: Declarar las cabeceras**

Reemplazar `next.config.ts` entero por:

```ts
import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// El origen de Supabase sale del entorno. Si falta, el proyecto no está
// configurado y la app ya redirige a /setup: no hay a quién dejar entrar.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Con quién puede hablar la app y de dónde puede traer cosas.
 *
 * `script-src` lleva 'unsafe-inline' porque Next y next-themes inyectan
 * scripts sin nonce. Nonces por request se generarían en proxy.ts, que es el
 * archivo más frágil del repo, y quedan como paso aparte. Lo que esta CSP sí
 * compra hoy es clickjacking, el control de a dónde puede hablar la app y la
 * imposibilidad de cargar recursos en claro.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // hubby nunca se muestra dentro de un iframe: no hay nada que embeber, y sí
  // una sesión que robar con un clic superpuesto.
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Las portadas se pegan a mano desde cualquier dominio: es una función del
  // editor de libros, no un descuido. Se limita a https, que descarta el
  // tráfico en claro.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Tailwind viaja como hoja, pero varios componentes calculan medidas con el
  // atributo style y eso también cae bajo style-src.
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  [
    "connect-src 'self'",
    supabase,
    // La búsqueda de libros pega directo desde el navegador.
    "https://openlibrary.org",
    // El recargado en caliente de Next habla por websocket.
    dev ? "ws:" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    // Fijado a mano porque hay un package-lock.json vacío en el home del
    // usuario y, sin esto, Next infiere /Users/tonchi como raíz del workspace.
    // Se usa cwd y no import.meta.url: Next compila este archivo a una ruta
    // temporal, así que import.meta.url no apunta a la carpeta del proyecto y
    // rompe la resolución de módulos.
    root: process.cwd(),
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // frame-ancestors ya lo dice; esto es para navegadores que no leen CSP.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Sin `preload`: entrar a la lista de precarga de los navegadores es
          // fácil y salir no, y no hace falta para una app personal.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Cerrar el referrer en la portada de la lista**

En `app/(app)/libros/library.tsx`, en el `<img>` de la portada, agregar
`referrerPolicy` justo después de `loading="lazy"`:

```tsx
    <img
      src={url}
      alt={`Portada de ${titulo}`}
      loading="lazy"
      // La URL de la portada la puede pegar cualquiera y apunta a donde sea.
      // Sin esto, ese host se entera de qué pantalla de hubby la pidió.
      referrerPolicy="no-referrer"
      width={ancho}
      height={alto}
```

- [ ] **Step 3: Cerrar el referrer en la vista previa del editor**

En `app/(app)/libros/book-editor.tsx`, en el `<img>` de la vista previa:

```tsx
              <img
                src={portada}
                alt=""
                // Ídem la lista: el host de la portada no tiene por qué saber
                // desde dónde se lo llamó.
                referrerPolicy="no-referrer"
                className="bg-sand h-[54px] w-9 shrink-0 rounded-sm object-cover"
              />
```

- [ ] **Step 4: Verificar que la CSP no rompe nada en desarrollo**

Run: `pnpm dev`

Abrir `http://localhost:3000`, entrar a los cuatro módulos, abrir el buscador de
libros y tipear tres letras, y abrir la consola del navegador.

Expected: **ningún error de "Refused to ..." en la consola.** Los que pueden
aparecer y qué significan:

| Error | Qué falta |
| ----- | --------- |
| `Refused to connect to 'https://xxx.supabase.co'` | La variable `NEXT_PUBLIC_SUPABASE_URL` no estaba al arrancar. Reiniciar `pnpm dev`. |
| `Refused to connect to 'ws://localhost'` | Falta la rama `dev` de `connect-src`. |
| `Refused to load the image` | Una portada por `http://`. Es el comportamiento buscado. |
| `Refused to apply inline style` | Falta `'unsafe-inline'` en `style-src`. |

- [ ] **Step 5: Verificar las cabeceras en el build de producción**

```bash
pnpm build
pnpm start & SERVIDOR=$!
sleep 4
curl -sI http://localhost:3000/login | grep -iE "content-security|x-frame|referrer|permissions|strict-transport|x-content"
kill $SERVIDOR
```

Expected: las seis cabeceras presentes, y la CSP **sin** `'unsafe-eval'` ni
`ws:` (esos son solo de desarrollo).

- [ ] **Step 6: Commit**

```bash
git add next.config.ts "app/(app)/libros/library.tsx" "app/(app)/libros/book-editor.tsx"
git commit -m "fix(seguridad): la app declara sus cabeceras

CSP con frame-ancestors none, connect-src acotado a Supabase y Open
Library, e img-src limitado a https -las portadas se pegan a mano desde
cualquier dominio, asi que no se puede cerrar mas sin romper esa
funcion-. Suma nosniff, Referrer-Policy, Permissions-Policy y HSTS.

script-src arranca con unsafe-inline: Next y next-themes inyectan
scripts sin nonce, y los nonces por request se generarian en proxy.ts.
Queda como paso aparte.

Las dos portadas van con referrerPolicy no-referrer: el host de una URL
pegada a mano no tiene por que saber desde donde se lo llamo."
```

---

## Tarea 5: Cerrar el open redirect del login

Única tarea con test unitario de verdad, y por eso va en TDD estricto.

**Files:**
- Create: `lib/rutas.ts`
- Create: `lib/rutas.test.ts`
- Modify: `app/login/page.tsx`
- Modify: `app/login/login-form.tsx:9`, `:38`

**Interfaces:**
- Produces: `rutaInterna(next: string | undefined | null): string` desde
  `@/lib/rutas`. Devuelve siempre una ruta de este sitio; `"/"` cuando la
  entrada no sirve.

- [ ] **Step 1: Escribir el test que falla**

Crear `lib/rutas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rutaInterna } from "@/lib/rutas";

describe("rutaInterna", () => {
  it("deja pasar una ruta del sitio", () => {
    expect(rutaInterna("/tareas")).toBe("/tareas");
  });

  it("conserva query y ancla", () => {
    expect(rutaInterna("/libros?q=dune#top")).toBe("/libros?q=dune#top");
  });

  it("manda a la home cuando no viene nada", () => {
    expect(rutaInterna(undefined)).toBe("/");
    expect(rutaInterna(null)).toBe("/");
    expect(rutaInterna("")).toBe("/");
  });

  it("rechaza una URL absoluta", () => {
    expect(rutaInterna("https://evil.com")).toBe("/");
    expect(rutaInterna("http://evil.com")).toBe("/");
  });

  // Las dos que pasaban el chequeo viejo de startsWith("/"): el navegador las
  // resuelve como absolutas y te saca del sitio.
  it("rechaza la URL sin protocolo", () => {
    expect(rutaInterna("//evil.com")).toBe("/");
    expect(rutaInterna("//evil.com/robar")).toBe("/");
  });

  it("rechaza la contrabarra, que el navegador normaliza a doble barra", () => {
    expect(rutaInterna("/\\evil.com")).toBe("/");
  });

  it("rechaza una ruta sin barra inicial", () => {
    expect(rutaInterna("tareas")).toBe("/");
  });

  it("deja pasar la home", () => {
    expect(rutaInterna("/")).toBe("/");
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm exec vitest run lib/rutas.test.ts`

Expected: FAIL — `Failed to resolve import "@/lib/rutas"`.

- [ ] **Step 3: Escribir la implementación mínima**

Crear `lib/rutas.ts`:

```ts
/**
 * Valida el `?next=` con el que el login vuelve a donde el usuario quería ir.
 *
 * No alcanza con `startsWith("/")`, que era el chequeo anterior: el navegador
 * resuelve `//evil.com` como una URL absoluta con el protocolo actual, y
 * normaliza `/\evil.com` al mismo destino. Las dos empiezan con barra y las dos
 * sacan del sitio, que es exactamente lo que el parámetro no puede hacer.
 *
 * Devuelve la home ante cualquier duda: perder el destino es una molestia,
 * mandar a alguien recién autenticado a un sitio ajeno es otra cosa.
 */
export function rutaInterna(next: string | undefined | null): string {
  if (!next || !next.startsWith("/")) return "/";
  if (next[1] === "/" || next[1] === "\\") return "/";
  return next;
}
```

- [ ] **Step 4: Correrlo y ver que pasa**

Run: `pnpm exec vitest run lib/rutas.test.ts`

Expected: PASS, los 8 tests en verde.

- [ ] **Step 5: Validar del lado del servidor**

En `app/login/page.tsx`, agregar el import:

```ts
import { rutaInterna } from "@/lib/rutas";
```

y reemplazar la línea `<LoginForm next={next} />` por:

```tsx
      {/* Validado acá y no en el formulario: el cliente recibe una ruta que ya
          se sabe de este sitio, y así hay un solo lugar donde puede fallar. */}
      <LoginForm next={rutaInterna(next)} />
```

- [ ] **Step 6: El formulario recibe una ruta ya validada**

En `app/login/login-form.tsx`, cambiar la firma (línea 9):

```ts
export function LoginForm({ next }: { next: string }) {
```

y el redirect (línea 38), reemplazando:

```ts
    router.replace(next?.startsWith("/") ? next : "/");
```

por:

```ts
    // Ya viene validada por rutaInterna() en la page: acá no se vuelve a
    // decidir, para que no haya dos reglas que puedan divergir.
    router.replace(next);
```

- [ ] **Step 7: Verificar todo**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm lint`

Expected: todo en verde, con 8 tests más que antes.

- [ ] **Step 8: Probarlo a mano**

Con `pnpm dev` y sin sesión iniciada, abrir:

1. `http://localhost:3000/login?next=//example.com` → entrar → Expected: cae en
   la home de hubby, **no** en example.com.
2. `http://localhost:3000/tareas` sin sesión → redirige a login con
   `?next=/tareas` → entrar → Expected: cae en `/tareas`.

- [ ] **Step 9: Commit**

```bash
git add lib/rutas.ts lib/rutas.test.ts app/login/page.tsx app/login/login-form.tsx
git commit -m "fix(seguridad): el next del login no puede sacarte del sitio

startsWith(\"/\") dejaba pasar //evil.com y /\\\\evil.com, que el navegador
resuelve como absolutas. La validacion pasa a una funcion pura con tests
y se aplica del lado del servidor, asi el formulario recibe una ruta que
ya se sabe interna."
```

---

## Tarea 6: La sesión se verifica sin salir a la red

Va sola y última porque es el único cambio con riesgo real: si sale mal, el
síntoma son logouts aleatorios, y este commit tiene que poder revertirse sin
arrastrar nada.

**Files:**
- Modify: `proxy.ts:41-46`

**Precondición que no está en el código:** el proyecto tiene que usar llaves de
firma asimétricas. Supabase → Authentication → JWT Keys → migrar a ECC. **Sin
eso el cambio es correcto pero no acelera nada**: `getClaims()` cae al mismo
pedido de red que hacía `getUser()`.

- [ ] **Step 1: Migrar las llaves en el dashboard de Supabase**

Entrar a Supabase → el proyecto de hubby → Authentication → JWT Keys, y migrar a
una llave asimétrica (ECC P-256).

Expected: el proyecto queda firmando con `ES256`/`RS256` y expone
`https://<proyecto>.supabase.co/auth/v1/.well-known/jwks.json`.

Verificarlo:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/.well-known/jwks.json" | head -c 200
```

Expected: un JSON con una clave `keys` que no está vacía. Si viene vacía, la
migración no se aplicó.

- [ ] **Step 2: Medir el antes**

Sin sesión, `/` redirige a `/login` **después** de verificar el token, así que
esto mide exactamente el camino que cambia —la verificación de la sesión— sin
mezclarle el tiempo de las consultas del panel.

```bash
pnpm build
pnpm start & SERVIDOR=$!
sleep 4
for i in $(seq 1 10); do curl -so /dev/null -w "%{time_starttransfer}\n" http://localhost:3000/; done | sort -n | sed -n 6p
kill $SERVIDOR
```

Expected: imprime la mediana del TTFB en segundos. Anotarla.

- [ ] **Step 3: Cambiar la verificación**

En `proxy.ts`, reemplazar:

```ts
  // No insertar NADA entre createServerClient y getUser(): cualquier await en
  // el medio desincroniza el refresh del token y produce logouts aleatorios.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) {
```

por:

```ts
  // No insertar NADA entre createServerClient y getClaims(): cualquier await en
  // el medio desincroniza el refresh del token y produce logouts aleatorios.
  //
  // getClaims() y no getUser(): con llaves de firma asimétricas verifica el JWT
  // localmente contra el JWKS del proyecto, que queda cacheado, en vez de
  // preguntarle al servidor de Auth en cada request. Refresca la sesión antes
  // de validar si el token está por vencer, así que el manejo de cookies es el
  // mismo. Si el proyecto volviera a firmar con el secreto simétrico, esto pasa
  // solo a comportarse como getUser(): más lento, nunca incorrecto.
  const { data } = await supabase.auth.getClaims();
  const autenticado = Boolean(data?.claims.sub);

  if (!autenticado && !isPublic(pathname)) {
```

Y unas líneas más abajo, reemplazar:

```ts
  if (user && pathname === "/login") {
```

por:

```ts
  if (autenticado && pathname === "/login") {
```

- [ ] **Step 4: Verificar tipos y lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`

Expected: sin errores.

- [ ] **Step 5: Medir el después**

Mismo comando del Step 2.

Expected: una mediana menor. Si es igual, revisar que el Step 1 se haya hecho:
sin llaves asimétricas no hay nada que ganar.

- [ ] **Step 6: Cazar el logout aleatorio**

Este es el motivo por el que la tarea va sola. Con `pnpm dev`:

1. Entrar con usuario y contraseña.
2. Navegar entre los cuatro módulos y volver a la home, diez veces.
3. Tocar algo que escriba en cada módulo: tildar un producto, marcar una tarea.
4. Cerrar sesión y volver a entrar, cinco veces.
5. Dejar la pestaña abierta más de una hora y volver a navegar — es lo que
   ejercita el refresh del token, que es el punto delicado.

Expected: nunca aparece la pantalla de login sin haber cerrado sesión, y ninguna
escritura falla.

Si aparece un logout que no pediste: revertir con `git revert` el commit del
Step 7 y avisar. Ninguna otra tarea depende de esta.

- [ ] **Step 7: Commit**

```bash
git add proxy.ts
git commit -m "perf(sesion): el token se verifica local y no contra la red

getUser() le preguntaba al servidor de Auth en cada request -cada
navegacion y cada Server Action arrancaban con un viaje de red-.
getClaims() verifica el JWT con el JWKS del proyecto, que queda cacheado.

Requiere que el proyecto firme con llaves asimetricas; con el secreto
simetrico viejo se comporta igual que antes."
```

---

## Tarea 7: Limpieza y verificación final

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Confirmar que konsta no se usa**

Run: `grep -rn "konsta" app components lib *.ts *.mjs 2>/dev/null`

Expected: sin resultados. Si aparece alguno, **no** sacar la dependencia y
avisar.

- [ ] **Step 2: Sacarla**

Run: `pnpm remove konsta`

Expected: `package.json` sin la línea y el lockfile actualizado.

- [ ] **Step 3: Verificación completa**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: los tests en verde (los de siempre más los 8 de `rutaInterna`), lint
limpio y build exitoso.

- [ ] **Step 4: Confirmar que los tests de resúmenes nunca se tocaron**

Run: `git log --oneline --name-only 18e1025..HEAD -- "lib/modules/*.test.ts"`

Expected: **salida vacía.** Es la prueba de que las reglas de negocio siguieron
siendo TypeScript puro de punta a punta. Si aparece algún commit, la separación
se rompió en algún momento y hay que revisar por qué.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: sacar konsta, que no la usa nadie

Estaba en devDependencies desde el arranque y no la referencia ningun
archivo del repo."
```

---

## Verificación de cierre

Con todo mergeado:

| Qué | Cómo | Esperado |
| --- | ---- | -------- |
| Sesión más rápida | La medición con `curl` de la Tarea 6 | Mediana menor |
| Panel más rápido | Con sesión iniciada, pestaña de Red del navegador: TTFB del documento `/` en cinco recargas duras. Necesita sesión, así que no se puede medir con `curl` a secas | Menor |
| Panel correcto | Abrir la home | Los mismos números e ítems que antes |
| Reglas intactas | `git log … -- "lib/modules/*.test.ts"` | Vacío |
| Sesión estable | Login/logout ×5 y una hora de pestaña abierta | Sin logouts espontáneos |
| Cabeceras puestas | `curl -sI` contra el deploy | Las seis presentes |
| Redirect cerrado | `/login?next=//example.com` | Cae en la home de hubby |
| Suite | `pnpm test && pnpm lint && pnpm build` | Verde |

## Plan de repliegue

El único commit con riesgo real es el de la Tarea 6. `git revert` sobre él
alcanza: ninguna otra tarea depende de ese cambio.

La Tarea 1 no se revierte con git — es una migración. Si hubiera que volver
atrás, se escribe una migración nueva que restaure las políticas anteriores.
Pero es el cambio menos riesgoso del plan: mantiene el mismo efecto de acceso y
solo agrega funciones que nadie más llama.
