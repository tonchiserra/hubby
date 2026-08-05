# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

hubby es una app personal (un solo usuario, sin equipos ni compartir) de Next.js 16
App Router + Supabase. El `README.md` documenta el producto y el deploy; acá está lo
operativo y las trampas que no se ven leyendo un archivo suelto.

## Comandos

El proyecto usa **pnpm**. Nunca `npm install`.

| Comando         | Qué hace                                                     |
| --------------- | ------------------------------------------------------------ |
| `pnpm dev`      | Servidor de desarrollo                                       |
| `pnpm build`    | Build de producción                                          |
| `pnpm test`     | Vitest, una sola corrida                                     |
| `pnpm lint`     | ESLint                                                       |
| `pnpm db:link`  | Asocia el repo al proyecto Supabase (una sola vez)           |
| `pnpm db:push`  | Aplica las migraciones de `supabase/migrations/`             |
| `pnpm db:types` | Vuelca el esquema real en `lib/supabase/types.generated.ts`  |

Un test solo: `pnpm exec vitest run lib/modules/tasks-reset.test.ts`, o por nombre con
`pnpm exec vitest run -t "buildGrocerySummary"`.

`vitest.config.mts` solo incluye `lib/**/*.test.ts` — entorno node, sin DOM. Los tests
de las funciones puras de módulos que viven en `app/(app)/<slug>/summary.ts` van igual
en `lib/modules/`, importando por alias `@/`. Un `*.test.ts` dentro de `app/` no lo
corre nadie.

## Arquitectura

### Registro de módulos

`lib/modules/registry.ts` es la única fuente de verdad: el panel y la navegación se
derivan de ese array. El `id` de cada módulo es el nombre de su tabla en singular
(`grocery_item` → `grocery_items`).

**Las dos separaciones que no se pueden romper:**

1. **`registry.ts` es client-safe, `summaries.ts` es `server-only`.** El registry lo
   consume código de cliente; meterle un import de servidor arrastra `next/headers` al
   bundle del navegador y el build falla. Los resúmenes se registran aparte, indexados
   por `id`, en `lib/modules/summaries.ts`.

2. **Un módulo caído no se lleva la home.** El panel junta los resúmenes con
   `Promise.all`, que rechaza entero apenas uno falla — y sin home no hay navegación,
   porque no hay toolbar ni sidebar. Cada resumen pasa por `resumenAislado()`
   ([lib/modules/safe-summary.ts](lib/modules/safe-summary.ts)): la tarjeta se degrada a
   "No se pudo cargar" con urgencia 0 y el error queda en el log del servidor.

### Anatomía de un módulo

Los cuatro módulos siguen la misma forma en `app/(app)/<slug>/`:

| Archivo        | Qué es                                                            |
| -------------- | ----------------------------------------------------------------- |
| `page.tsx`     | Server Component: lee y arma el encabezado                        |
| `queries.ts`   | Lecturas. `server-only`, sin filtrar por `user_id`                |
| `actions.ts`   | Server Actions de escritura, cada una con su `revalidatePath`     |
| `summary.ts`   | `build*Summary()` puro + `get*Summary()` que consulta             |
| `loading.tsx`  | Esqueleto con la misma silueta que la pantalla real               |
| `<nombre>.tsx` | Client Component con la interacción (`pantry`, `library`, …)      |

Las reglas de negocio se sacan a funciones puras (los `build*Summary`, `reset.ts` de
tareas) y se testean sin base de datos. `getGrocerySummary` es el modelo a copiar:
`count: "exact"` + `limit` en una sola ida y vuelta.

Toda escritura revalida `/` además de su propia ruta: el panel muestra sus contadores.

Agregar un módulo: migración → tipos en `lib/supabase/types.ts` → entrada en
`registry.ts` → carpeta en `app/(app)/` → alta en `summaries.ts` → test de la función
pura en `lib/modules/`. Mergear sin correr `pnpm db:push` es la forma conocida de dejar
la tarjeta en "No se pudo cargar".

### Datos y sesión

- **RLS es la seguridad, no el código.** Nunca filtrar por `user_id` en las consultas:
  la política de dueño ya lo hace en la base. Repetirlo da la falsa impresión contraria.
- **Todo archivo que consulte la base lleva `import "server-only";` como primera línea.**
- `lib/supabase/types.ts` está escrito a mano y es el que importa la app (incluye alias
  como `GroceryItem`, `Book`, `Wish`, `BookStatus` que el CLI no genera). `pnpm db:types`
  escribe `types.generated.ts`, que sirve para comparar contra el esquema real y **no**
  reemplaza al otro.
- Sin credenciales de Supabase la app no rompe: `lib/supabase/config.ts` lo detecta y
  `app/(app)/layout.tsx` redirige a `/setup`.
- Una migración por cambio en `supabase/migrations/`. Cada tabla de módulo repite la
  convención del init: `user_id uuid not null default auth.uid()` con `on delete cascade`,
  RLS con política de dueño para `authenticated`, índice que cubra el acceso real de la
  pantalla, trigger `set_updated_at`, e índice único sobre `lower(trim(nombre))` donde no
  se quieran repetidos.

### Trabajo diferido (tareas)

El reinicio de las listas no lo corre ningún proceso de fondo: se calcula al leer, en
`app/(app)/tareas/queries.ts`, con las reglas puras de `reset.ts`. Al aplicarlo, primero
se destildan las tareas y **después** se mueve `last_reset_on` — al revés se pierde el
reinicio hasta la vuelta siguiente, que en una lista anual es un año. Se guarda la fecha
que tocaba, no la de hoy. Las fechas se manejan como texto `YYYY-MM-DD` (son fechas de
calendario, no instantes) y en la zona `America/Argentina/Buenos_Aires`.

## Sistema visual

La regla, escrita completa arriba de `app/globals.css`: **el color no marca urgencia,
marca pertenencia.** El acento va en los detalles (íconos, marcas, focos) y nunca en el
fondo de la pantalla. Lo que reclama atención se distingue por relleno: sólido reclama,
lavado pertenece. El terracota es solo para lo destructivo. Hay un solo acento para toda
la app, no uno por módulo.

Antes de tocar el look, leer `docs/plans/2026-08-01-ui-color-pertenencia-design.md`: hay
tres rediseños rechazados y el diagnóstico de por qué ajustar tokens nunca alcanzó.

Dos reglas que el código da por sentadas:

- **Todo ícono va adentro de un `IconChip`.** Las excepciones están enumeradas con su
  motivo en `lib/design/icon-usage.test.ts`, indexadas por `ruta:NombreDelIcono`. Un
  ícono suelto nuevo hace fallar el test hasta que se lo envuelve o se lo justifica ahí.
- **Todo cambio de estado se anima**, con los presets de `lib/motion.ts` (resortes, no
  duraciones fijas). No definir tiempos a mano.

Clases con `cn()` de `lib/utils.ts`, no `twMerge` pelado: la escala tipográfica del
`@theme` está registrada ahí y sin eso tailwind-merge confunde `text-headline` con
`text-primary` y descarta una de las dos.

## Trampas conocidas

- **`proxy.ts`, no `middleware.ts`.** En Next 16 el archivo se llama así y exporta
  `proxy`. Adentro, **no meter nada entre `createServerClient()` y `getUser()`**:
  cualquier `await` en el medio desincroniza el refresh del token y produce logouts
  aleatorios. Y devolver `supabaseResponse` tal cual — recrearlo descarta las cookies
  recién refrescadas.
- **`next.config.ts` fija `turbopack.root` con `process.cwd()`, no `import.meta.url`.**
  Next compila ese archivo a una ruta temporal. `vitest.config.mts` hace lo opuesto (usa
  `import.meta.url`) porque Vite lo carga desde su ubicación real: son casos inversos a
  propósito, están comentados en ambos archivos.
- **`vitest.config.mts` aliasea `server-only` a `node_modules/server-only/empty.js`.** Sin
  eso, cualquier test que alcance un archivo de servidor revienta al importarlo.
- Las view transitions usan la API nativa del navegador vía
  `lib/view-transition.ts`, no el `ViewTransition` de React ni el flag experimental de
  Next. El timing de 120ms está calibrado para soltar la transición cuando commitea
  `loading.tsx`; esperar al árbol real congelaba la pantalla 1,5s.
- `app/(app)/layout.tsx` lleva `export const dynamic = "force-dynamic"`: todo lo que
  cuelga de ahí depende de la sesión y sin eso el build intenta prerenderizarlo y falla.

## Convenciones

- El texto de interfaz va en **español rioplatense** (voseo): "tocá", "deslizá", "agregá".
- Comentarios y documentación también en español. Los comentarios explican *por qué*, no
  *qué* — mirar los existentes antes de escribir uno.
- Commits en español, en imperativo, **sin tildes en el mensaje**, con prefijo tipo
  `feat(modulo):` / `fix(ui):` / `docs:`.
- Los mensajes de error de Supabase no se muestran crudos en pantalla (filtran nombres de
  tablas y columnas): van al log del servidor y al usuario le llega algo accionable. Ver
  `describe()` en `app/(app)/supermercado/actions.ts`, que nombra explícitamente el caso
  de esquema desactualizado.
