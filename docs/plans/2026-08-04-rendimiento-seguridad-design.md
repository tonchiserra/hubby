# Rendimiento y seguridad sobre lo que ya está

**Fecha:** 2026-08-04
**Estado:** aprobado por Gonzalo
**Alcance:** ningún módulo nuevo, ningún cambio de UX. Solo lo que ya existe.

## Punto de partida

La auditoría cubrió los cuatro módulos, `proxy.ts`, los clientes de Supabase,
las siete migraciones y los imports del bundle. Conviene anotar primero lo que
está bien, para que quede claro dónde **no** hay que meter mano:

- No hay secretos commiteados. Solo `.env.example` está trackeado.
- RLS está activa en las cinco tablas, con `using` y `with check` en cada
  política. La doctrina de "RLS es la seguridad, no el código" se sostiene.
- Los links externos de deseos ya llevan `rel="noopener noreferrer"`.
- Las Server Actions validan de los dos lados y no muestran errores crudos.
- No hay ningún `dangerouslySetInnerHTML` en el código de la app.

Lo que sigue es lo que sí apareció.

## Hallazgos

### Rendimiento

| # | Dónde | Qué pasa |
| - | ----- | -------- |
| P1 | `proxy.ts` | `getUser()` pega contra el servidor de Auth **en cada request**: cada navegación y cada Server Action arrancan con un viaje de red. |
| P2 | `app/(app)/page.tsx` | El panel dispara **9 consultas** a PostgREST para pintar cuatro tarjetas, con seis `count: "exact"` adentro. |
| P3 | `app/(app)/tareas/summary.ts` | El resumen reusa `getLists()`: trae todas las listas con todas sus tareas enteras para contar pendientes y quedarse con tres títulos, y **escribe durante el render de la home** cuando hay reinicios vencidos (un update de tareas más uno por lista). |
| P4 | Las cinco políticas RLS | `auth.uid()` sin envolver en `(select …)` se evalúa por fila en vez de una vez. |
| P5 | `grocery_items_user_active_name_idx` | El índice es sobre `lower(trim(name))` y las consultas ordenan por `name` pelado: el índice no sirve para el orden. |
| P6 | `package.json` | `konsta` está en devDependencies con cero referencias en el repo. |

### Seguridad

| # | Dónde | Qué pasa |
| - | ----- | -------- |
| S1 | `next.config.ts` | **No hay ninguna cabecera de seguridad.** Sin CSP, sin `frame-ancestors`, sin `Referrer-Policy`, sin `nosniff`. Y la app carga `<img>` de dominios arbitrarios: hoy cualquier host que le pongas a `cover_url` ve tu request con el referrer de hubby. |
| S2 | `app/login/login-form.tsx` | `next?.startsWith("/")` frena `https://evil.com` pero no `//evil.com` ni `/\evil.com`, que el navegador resuelve como absolutas. Open redirect. |
| S3 | Migración de tareas | La política de `tasks` valida `user_id` pero no valida que `list_id` apunte a una lista tuya, y `addTask` recibe el `listId` del cliente. La foreign key solo chequea que exista. |
| S4 | `init.sql` | `set_updated_at` es `security definer` sin necesitarlo. |

## El diseño

### 1. Sesión: una llamada de red menos por request

En `proxy.ts`, `getUser()` pasa a `getClaims()`, leyendo `data.claims.sub` en
lugar de `user`. La forma no cambia: sigue sin haber nada entre
`createServerClient()` y la llamada de auth.

Verificado contra `@supabase/auth-js` 2.111.0, que es el que está instalado:

- El método existe y está documentado como la vía recomendada.
- **Refresca la sesión antes de validar** si el token está por vencer, así que
  el baile de cookies que documenta el comentario de `proxy.ts` se mantiene.
- Con llaves asimétricas verifica localmente con WebCrypto contra el JWKS, que
  queda cacheado.
- **Con el secreto simétrico viejo hace exactamente lo mismo que `getUser()`.**

De ahí sale la única precondición que no está en el código: hay que migrar el
proyecto a llaves de firma asimétricas en Supabase → Authentication → JWT Keys.
Lo hace Gonzalo. El código queda correcto en los dos escenarios; sin la
migración simplemente no se nota la mejora.

Matiz honesto: en Vercel el JWKS se recachea en cada arranque en frío, así que
el ahorro es "casi todos los requests", no "todos".

**Lo que se resigna.** `getUser()` le preguntaba al servidor de Auth en cada
request, así que una sesión revocada —borrada desde el panel de Supabase, o
cerrada desde otro dispositivo— dejaba de servir al instante. Con verificación
local, ese token sigue siendo válido hasta que vence, o sea hasta una hora.

Es una mejora de rendimiento que se paga en tiempo de revocación, y para una app
de una sola persona el precio es chico: no hay sesiones ajenas que expulsar. Si
alguna vez hiciera falta echar a alguien en el acto, la vuelta a `getUser()` es
un cambio de dos líneas.

*(Anotado el 2026-08-04, después de implementarlo: no estaba en la versión
original de este diseño y lo levantó la revisión.)*

### 2. Panel: de nueve consultas a dos

Una función `public.panel_resumen()` —`security invoker`, misma convención que
`reorder_books`— que devuelve **contadores crudos** en JSON para supermercado,
libros y deseos: números y los nombres del preview. Ninguna regla adentro.

Los `build*Summary` no se tocan: siguen siendo TypeScript puro recibiendo esos
números. **Los tests existentes no cambian una línea**, y eso es exactamente la
prueba de que la separación se respetó.

Tareas queda afuera del RPC a propósito. Su resumen tiene que aplicar los
reinicios vencidos, y esa lógica vive en TS justamente porque es la parte que
más fácil se equivoca —meses de 30 días, febrero, fin de año— y ahí se puede
probar cada borde sin base. Lo que sí se arregla en tareas:

- La lectura pide columnas explícitas en vez de `*`.
- Los N updates de marcado se colapsan en uno solo con un RPC
  `marcar_reinicios(ids, marcas)`, mismo patrón que `reorder_books`. Es una
  mejora de cola, no de camino común: los reinicios ocurren una vez por semana
  o por mes.

Sobre el aislamiento por módulo: `getPanelCounters()` va envuelto en `cache()`
de React y cada `get*Summary()` toma su pedazo. `summaries.ts` y
`resumenAislado()` quedan igual. **Si el RPC falla, las cuatro tarjetas se
degradan juntas en vez de una sola.** Es un cambio real respecto de hoy y se
acepta con los ojos abiertos: lo que la regla protege es que la home siga
renderizando y se pueda navegar, y eso se mantiene intacto.

### 3. Cabeceras

`headers()` en `next.config.ts`, para todas las rutas:

- CSP con `frame-ancestors 'none'`, `default-src 'self'`,
  `connect-src` con la URL de Supabase y Open Library,
  `img-src 'self' data: https:`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  HSTS, y `X-Frame-Options: DENY` para navegadores viejos.
- `referrerPolicy="no-referrer"` en los dos `<img>` de portada, que es el
  arreglo puntual de la fuga de referrer.

Dos decisiones tomadas explícitamente:

**`script-src` arranca con `'unsafe-inline'`.** Next inyecta scripts inline y
next-themes también. La alternativa —nonce por request generado en `proxy.ts`—
es la única CSP que de verdad frena XSS, pero mete lógica nueva en el archivo
más frágil del repo, que ya se toca en el punto 1. La superficie de XSS acá es
mínima: React escapa todo y no hay HTML crudo en ningún lado. Queda como
seguimiento posible, no como deuda urgente.

**`img-src` admite cualquier https.** Cerrarlo a `covers.openlibrary.org`
rompería pegar la URL de una portada de otro lado, que hoy funciona y está
documentado en el editor de libros. Se bloquea `http://` y el referrer se cierra
por otro lado.

### 4. Open redirect

Un helper puro `rutaInterna()` en `lib/`, con sus tests, que exige `^\/`
seguido de algo que no sea `/` ni `\`. Se aplica en `app/login/page.tsx`, del
lado del servidor, antes de pasarle el valor al cliente.

### 5. Migración de limpieza

- Las cinco políticas reescritas con `(select auth.uid())`.
- El `with check` de `tasks` extendido con un `exists` sobre `public.task_lists`
  que valide la pertenencia de `list_id`. Solo en `with check`: meterlo en
  `using` encarecería todas las lecturas para cubrir un caso de escritura.
- `set_updated_at` a `security invoker`.
- El índice de `grocery_items` alineado con el orden que la consulta pide.
- `konsta` fuera del `package.json`.

Aclaración honesta: el índice y el `(select …)` **no van a dar una mejora
medible** con el volumen de una app personal. Entran porque hoy el índice no
hace lo que dice su comentario, no porque se vaya a notar.

## Orden de trabajo

1. Migración: RPCs, políticas, índice, trigger. La app todavía no los usa, así
   que no puede romper nada.
2. Panel al RPC.
3. Cabeceras y `referrerPolicy`.
4. Open redirect y su test.
5. `proxy.ts`, **último y solo**. Es el cambio riesgoso y merece un commit que
   se pueda revertir sin arrastrar nada más.
6. Limpieza de `konsta`.

## Verificación

- TTFB de `/` con build de producción, mediana de diez requests, antes y después.
- `pnpm test`: los tests de resúmenes tienen que pasar **sin tocarse**. Si hubo
  que editarlos, la separación se rompió.
- `pnpm build` y `pnpm lint`.
- Ciclo de login y logout repetido, para cazar el logout aleatorio si
  `getClaims()` se comportara distinto de lo documentado.

## Plan de repliegue

El único cambio con riesgo real es el de `proxy.ts`. Si aparecen logouts
aleatorios, se vuelve a `getUser()` y todo el resto del plan queda en pie: nada
más depende de ese cambio.
