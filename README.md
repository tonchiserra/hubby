# hubby

Todo lo que trackeás, en un solo lugar. Next.js 16 (App Router) + Supabase.

## Desarrollo local

```bash
pnpm install
cp .env.example .env.local   # completar con las credenciales del proyecto Supabase
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). Sin credenciales la app no
falla: redirige a `/setup`, que explica paso a paso qué falta.

Comandos:

| Comando         | Qué hace                                    |
| --------------- | ------------------------------------------- |
| `pnpm dev`      | Servidor de desarrollo                      |
| `pnpm build`    | Build de producción                         |
| `pnpm test`     | Tests (vitest)                              |
| `pnpm lint`     | ESLint                                      |
| `pnpm db:push`  | Aplica las migraciones al proyecto Supabase |
| `pnpm db:types` | Regenera `lib/supabase/types.generated.ts`  |

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
