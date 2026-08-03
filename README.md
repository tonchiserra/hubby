# hubby

Todo lo que trackeás, en un solo lugar. Next.js 16 (App Router) + Supabase.

Es una app de una sola persona: no hay equipos ni compartir. Cada tabla lleva
`user_id` y RLS, así que la separación la garantiza la base y no el código.

## Módulos

| Módulo           | Ruta            | Qué guarda                                                       |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| **Supermercado** | `/supermercado` | Inventario de casa. Lo que se terminó *es* la lista de compras.   |
| **Libros**       | `/libros`       | Leídos, en curso y por leer. Portadas y datos de Open Library.    |
| **Deseos**       | `/deseos`       | Lo que te querés comprar, con precio y link a dónde.              |
| **Ajustes**      | `/ajustes`      | Sesión, tema y cerrar sesión. No es un módulo, es configuración.  |

La home es el menú: una tarjeta por módulo, las que reclaman algo primero. No
hay barra de navegación ni sidebar — el modelo es de pila, se entra a una
pantalla y se vuelve con el botón del encabezado.

### Qué hace que un módulo reclame atención

Cada módulo aporta un `ModuleSummary` (`urgency`, `detail`, `preview`). Con
`urgency > 0` la tarjeta se pinta con el acento y muestra el contador y hasta
tres ítems concretos; con `urgency = 0` queda en papel. El orden del panel sale
de ahí, con desempate alfabético para que no baile entre cargas.

Qué cuenta como urgente lo decide cada módulo, y la regla no es "cuántas cosas
tiene":

- **Supermercado**: los productos que faltan.
- **Libros**: los que estás leyendo. La pila de "quiero leer" puede ser infinita
  y no reclama nada.
- **Deseos**: solo los marcados como *próximo*, que es la decisión explícita de
  comprarlo. Querer veinte cosas no es tener veinte pendientes.

Las reglas viven en el `summary.ts` de cada módulo, en una función pura que se
testea sin base de datos.

## Desarrollo local

```bash
pnpm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). Sin credenciales la app no
falla: redirige a `/setup`, que explica paso a paso qué falta.

Comandos:

| Comando         | Qué hace                                            |
| --------------- | --------------------------------------------------- |
| `pnpm dev`      | Servidor de desarrollo                              |
| `pnpm build`    | Build de producción                                 |
| `pnpm test`     | Tests (vitest)                                      |
| `pnpm lint`     | ESLint                                              |
| `pnpm db:link`  | Asocia el repo al proyecto Supabase (una sola vez)  |
| `pnpm db:push`  | Aplica las migraciones al proyecto Supabase         |
| `pnpm db:types` | Vuelca el esquema en `lib/supabase/types.generated.ts` |

## Cómo está armado

```
app/(app)/            pantallas con sesión: panel, módulos, ajustes
app/login, app/setup  las dos rutas públicas
components/hubby/     piezas con opinión: tarjeta de módulo, lista, swipe, header
components/ui/        primitivas: botón, checkbox, segmentado, diálogo…
lib/modules/          registro de módulos y contrato del panel
lib/supabase/         clientes de servidor y de navegador, tipos del esquema
proxy.ts              sesión y rutas protegidas
supabase/migrations/  el esquema, una migración por cambio
```

### Anatomía de un módulo

Los tres siguen la misma forma, y conviene copiarla:

| Archivo          | Qué es                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `page.tsx`       | Server Component: lee y arma el encabezado                          |
| `queries.ts`     | Lecturas. `server-only`, sin filtrar por `user_id` — de eso va RLS  |
| `actions.ts`     | Server Actions de escritura, con su `revalidatePath`                |
| `summary.ts`     | Lo que el módulo le aporta al panel: función pura + su consulta     |
| `loading.tsx`    | Esqueleto con la misma silueta que la pantalla real                 |
| `<nombre>.tsx`   | El Client Component con la interacción (`pantry`, `library`, …)     |

### Las dos separaciones que hay que respetar

**Registro vs. resúmenes.** `lib/modules/registry.ts` es metadata pura y la
consume código de cliente. `lib/modules/summaries.ts` importa las consultas y es
`server-only`. Mezclarlos arrastra `next/headers` al bundle del navegador y el
build falla — ya pasó.

**Un módulo caído no se lleva la home.** El panel junta los resúmenes con
`Promise.all`, que rechaza entero apenas uno falla; sin la home no hay forma de
navegar. Por eso cada resumen pasa por `resumenAislado()`: la tarjeta se degrada
a "No se pudo cargar" con urgencia 0, y el error queda en el log del servidor.
La red de contención de las pantallas de módulo es `app/(app)/error.tsx`, que
siempre ofrece volver al menú.

### Sesión

`proxy.ts` — en Next 16 el archivo se llama así y exporta `proxy`, no
`middleware` — refresca el token en cada request y manda a `/login` lo que no
sea público (`/login`, `/setup`). Login con email y contraseña; los usuarios se
crean desde el panel de Supabase.

Adentro de `proxy.ts` no hay que meter nada entre `createServerClient()` y
`getUser()`: cualquier `await` en el medio desincroniza el refresh y produce
logouts aleatorios.

### Base de datos

Una migración por cambio, en `supabase/migrations/`. Cada tabla de módulo repite
la convención que fija el init:

- `user_id uuid not null default auth.uid()` con `on delete cascade`
- RLS activo y una política de dueño para `authenticated`
- índice que cubre el acceso real de la pantalla
- trigger `set_updated_at`
- índice único sobre `lower(trim(nombre))` donde no se quieren repetidos

Los tipos de `lib/supabase/types.ts` están escritos a mano y son los que importa
la app. `pnpm db:types` escribe aparte, en `types.generated.ts`, para comparar
contra el esquema real: los alias del final (`GroceryItem`, `Book`, `Wish`,
`BookStatus`…) no salen del CLI, así que ese archivo no reemplaza al otro.

## Sistema visual

La regla, escrita completa arriba de `app/globals.css`:

> El color no marca urgencia: marca pertenencia.

El acento va en los detalles —íconos, marcas, focos— y nunca en el fondo de la
pantalla. Lo que reclama atención se distingue por relleno: **sólido reclama,
lavado pertenece**. El terracota es solo para lo destructivo; que falte leche no
es un error, es el tema de la app.

Otras dos reglas que el código da por sentadas:

- **Todo ícono va adentro de un `IconChip`.** Las excepciones son deliberadas y
  están enumeradas con su motivo en `lib/design/icon-usage.test.ts`. Si agregás
  un ícono suelto, el test falla hasta que lo envolvés o lo justificás ahí.
- **Todo cambio de estado se anima**, y los tiempos salen de `lib/motion.ts`:
  resortes, no curvas de duración fija, para que el movimiento absorba
  interrupciones en vez de saltar.

## Tests

`pnpm test` (vitest, sin DOM). Cubren las reglas puras: qué le aporta cada
módulo al panel, cómo se ordena, cómo se degrada un resumen caído, y el uso de
íconos. Todo lo que sea una regla de negocio conviene sacarlo a una función pura
—como los `build*Summary`— y probarlo ahí.

## Deploy en Vercel

Vercel detecta Next.js solo: no hace falta `vercel.json` ni tocar los comandos
de build. Lo único obligatorio son las dos variables de entorno.

### 1. Importar el repo

Desde [vercel.com/new](https://vercel.com/new), elegir `tonchiserra/hubby`.
Framework: Next.js. Package manager: pnpm (lo infiere del `pnpm-lock.yaml`).

O desde la terminal, en la raíz del proyecto:

```bash
pnpm dlx vercel@latest login
pnpm dlx vercel@latest link      # crea o asocia el proyecto
pnpm dlx vercel@latest --prod    # deploy a producción
```

### 2. Variables de entorno

En Project Settings → Environment Variables, cargar las dos para los tres
entornos (Production, Preview, Development):

| Variable                               | De dónde sale                                            |
| -------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API Keys → Project URL     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key |

Las dos son públicas por diseño: viajan al navegador y lo que protege los datos
es RLS, no esconder la clave. La *secret key* no se usa en este proyecto y no
debe cargarse en Vercel.

Si el deploy queda sin variables, el build igual pasa y la app sirve `/setup` en
vez de romper. Cargarlas después requiere un redeploy: al ser `NEXT_PUBLIC_`
quedan horneadas en el bundle del cliente en tiempo de build.

### 3. Base de datos

Las migraciones de `supabase/migrations/` se aplican contra el proyecto de
Supabase, no desde Vercel:

```bash
pnpm db:link     # una sola vez
pnpm db:push
```

Mergear un módulo sin correr su migración es la forma conocida de romper la app:
la tabla no existe, su resumen falla y la tarjeta queda en "No se pudo cargar".

### 4. Auth

El login es email + contraseña, así que no hay callbacks de OAuth que
configurar. Los usuarios se crean desde el panel de Supabase (Authentication →
Users). Conviene igual dejar el dominio de Vercel en Supabase → Authentication →
URL Configuration → Site URL, porque de ahí salen los links de los mails de
recuperación de contraseña.

### Después del primer deploy

Cada push a `main` publica a producción y cada push a otra rama genera un
preview. Los previews comparten la misma base que producción salvo que se les
cargue otra URL en las variables del entorno Preview.

## Agregar un módulo

1. Migración en `supabase/migrations/` siguiendo la convención de tabla, y
   `pnpm db:push`.
2. Tipos y alias en `lib/supabase/types.ts`.
3. Entrada en `lib/modules/registry.ts` (`id` = nombre de la tabla en singular).
4. Carpeta en `app/(app)/<slug>/` con los archivos de la anatomía.
5. Registrar `getXSummary` en `lib/modules/summaries.ts`, indexado por `id`.
6. Test de la función pura del resumen, al lado de los otros en `lib/modules/`.
