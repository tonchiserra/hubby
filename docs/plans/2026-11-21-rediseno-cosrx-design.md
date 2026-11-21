# Rediseño de hubby con el UI Kit de COSRX — como Platita

**Fecha:** 2026-11-21
**Estado:** implementado, sin commitear (pedido: "Todo como Platita")
**Reemplaza:** el sistema visual de `docs/plans/2026-08-01-ui-color-pertenencia-design.md`

## Qué se pidió

Lo mismo que se hizo en Platita el 2026-11-20:

1. Mover la base de Supabase y las funciones de Vercel a São Paulo.
2. Rediseñar la UI con el UI Kit de COSRX AR (Innovate, `~/Desktop/Innovate/cosrx-theme`),
   con las correcciones que Gonzalo le hizo a Platita.
3. Revisar el código y la base.

## 1. Migración (hecha, 2026-11-21)

| | Antes | Ahora |
|---|---|---|
| Supabase | `Hubby`, `ca-central-1` (Montreal) | `Hubby SP`, ref `kiidscaeqefurjnlesbf`, `sa-east-1` |
| Una consulta desde Argentina | ~210–230 ms | ~55–75 ms |
| Funciones de Vercel | `iad1` | `gru1` |

Cómo se hizo:

- Se hizo un volcado completo: roles, esquema, datos (usuarios incluidos) y el historial de
  `supabase_migrations`, así `pnpm db:push` no reaplica las 8 migraciones.
- Se restauró en una sola transacción. Los datos quedaron idénticos byte a byte en las 5 tablas,
  `auth.users` y `auth.identities`.
- El proyecto viejo quedó **pausado** (el plan Free admite dos activos). El respaldo está en
  `~/Desktop/Projects/hubby-backups/2026-11-21-ca-central-1/`, con checksums.
- En Auth se replicó `disable_signup: true`: es una app de un solo usuario y el proyecto nuevo venía
  con el registro abierto. La firma sigue siendo ES256, así que `getClaims()` verifica localmente.
- En Vercel, las dos variables `NEXT_PUBLIC_SUPABASE_*` pasaron a tipo Config: Vercel ya no admite
  Secret para variables `NEXT_PUBLIC_`, que son públicas por diseño. Producción se redeployó sobre
  el mismo commit.

## 2. Diagnóstico de rendimiento del cliente

El JS propio de cada ruta, medido en el build:

| Ruta | gzip |
|---|---|
| `/` (panel) | 34 KB |
| `/supermercado`, `/libros`, `/tareas` | ~113 KB |

El peso viene de tres paquetes:

- `motion`: entradas y salidas, `Reorder` en libros, la pastilla del segmentado y `MotionConfig`.
- `radix-ui`: `Dialog`, `Checkbox`, `Switch` y el `Slot` del botón.
- `@phosphor-icons/react`: 28 íconos.

Tailwind 4 **no** es un costo: compila a CSS estático y no tiene runtime, a diferencia del
Chakra/Emotion que se sacó de Platita. Por eso se queda como motor de estilos y se reemplazan
solo los tres paquetes de arriba:

| Antes | Después |
|---|---|
| `Dialog` de Radix | `<dialog>` nativo con `showModal()`: hoja abajo en el teléfono, modal en escritorio (el `Sheet` de Platita) |
| `Checkbox` / `Switch` de Radix | `<input type="checkbox">` nativo con estilo propio |
| `Slot` de Radix | prop `asChild` resuelta con `cloneElement` |
| `AnimatePresence` / `motion.*` | `<ViewTransition>` de React por fila (entra y sale animada cuando una Server Action revalida) y transiciones CSS |
| `Reorder` de `motion` | arrastre propio con Pointer Events |
| Pastilla del segmentado con resorte | pastilla deslizante en CSS, como en Platita |
| Phosphor | íconos SVG propios con los mismos nombres de componente (`BasketIcon`, `TrashIcon`…), al spec del kit: grilla de 24, trazo de 1,6 y extremos redondeados |

## 3. Lenguaje visual

Es el de Platita, con estas correcciones de Gonzalo:

- **UI clara, sin bloques negros.** Fondo blanco, superficies en gris producto `#F3F2EF`, tarjetas
  blancas con borde, líneas grises. El negro `#231F20` queda solo para el texto.
- **El color de la marca va donde el kit pone el amarillo.** En Platita fue el azul de siempre de
  la app. En hubby es el salvia `#4a7a5b`, el acento aprobado en agosto. El verde del ícono
  (`#29a383`) no sirve para esto: con blanco encima da 3,2:1 y no pasa AA. El salvia da 5:1.
- **Rótulos:** mayúsculas chicas con un punto de acento, nunca el formato `[/ … /]`.
- **Cifras importantes en bold:** los contadores del panel y las estadísticas.
- **Tipografía libre:** Hanken Grotesk para el texto, Mona Sans expandida para los titulares y
  Mona Sans bold para las cifras.
- **Forma:** píldoras para lo que se toca, tarjetas de 10 px, cucardas de 4 px.
- **Rojo solo para lo destructivo.** Reemplaza al terracota.
- **Todo se anima.** Páginas con View Transitions, filas que entran y salen, acordeones que abren
  con su altura, `prefers-reduced-motion` respetado.

Lo que se conserva de hubby, porque es producto y no estilo:

- El modelo de **pila**: el panel es el menú y cada módulo tiene su botón de volver. No hay barra
  de navegación.
- El **orden por urgencia** del panel.
- **Todo ícono dentro de un `IconChip`**, con su test de excepciones. El chip es un círculo lavado
  del acento, plano y sin el degradado de antes. Cuando el módulo reclama atención pasa a sólido.
- **La tarjeta que reclama ya no se pinta entera.** Era un bloque de color, y en Platita la UI clara
  sin bloques fue un pedido explícito. Lo que reclama atención se ve en los detalles: el chip
  sólido y el contador en bold del acento.
- Las interacciones: deslizar para borrar, el reorden manual de libros y los diálogos de edición.
- El ícono de la app y el wordmark "hubby".

## 4. Código y base

- La capa de datos (`queries.ts`, `actions.ts`, `summary.ts`, el registro de módulos y sus 61
  tests) ya estaba revisada desde la pasada de agosto y se mantiene. Cambian la vista y su
  infraestructura.
- `getUser()` del servidor ahora lee los claims (`getClaims()`), como Platita. Solo lo usaba
  Ajustes, y le costaba un viaje al servidor de Auth en cada render.
- El login carga el cliente de Supabase recién al enviar el formulario.
- Se borraron componentes que nadie usaba: `StatTile`, `Card`, `Badge` y `Switch`.
- Se corrigieron tres problemas que trajo o destapó el rediseño:
  - Borrar una lista de tareas se llevaba todas sus tareas con un solo toque. Ahora pide
    confirmación.
  - Los editores anidaban `<label>` (el rótulo del campo envolvía un segmentado que ya trae los
    suyos).
  - Las acciones del deslizamiento se veían debajo de cada fila y "Editar" era blanco sobre gris.
- **Base:** los advisors de Supabase sobre el proyecto nuevo dieron:
  - Una sola clave foránea sin índice, `tasks.user_id`. Está cubierta por la migración
    `20261121120000_tasks_user_id_idx.sql`, aplicada con `pnpm db:push`.
  - Los "índices sin uso" son ruido de un proyecto recién restaurado, con las estadísticas en cero.
  - La protección de contraseñas filtradas (HaveIBeenPwned) es del plan Pro.
  - Las políticas ya usaban `(select auth.uid())` y `to authenticated` desde agosto.

## 5. Resultado

El JS propio de cada ruta, en gzip:

| Ruta | Antes | Después |
|---|---|---|
| `/` (panel) | 34 KB | 32 KB |
| `/supermercado` | 113 KB | 41 KB |
| `/deseos` | — | 41 KB |
| `/tareas` | 113 KB | 42 KB |
| `/libros` | 114 KB | 54 KB |

`/login` bajó de 92 KB a 29 KB al cargar el cliente de Supabase recién al enviar el formulario.

`motion`, `radix-ui`, `@phosphor-icons/react` y `@radix-ui/colors` (que no se usaba) salieron de
las dependencias.
