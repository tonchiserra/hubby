# UI de hubby: el color como pertenencia

**Fecha:** 2026-08-01
**Estado:** aprobado por Gonzalo
**Reemplaza:** la regla de color de `docs/plans/2026-07-31-rediseno-ui-design.md`

## Por qué hay un cuarto intento

Tres rediseños fueron rechazados. Los tres cambiaron color, espaciado y radios;
ninguno tocó la regla que los gobernaba, que estaba escrita en el encabezado de
`app/globals.css`:

> Dentro de esa pantalla, el color marca lo que reclama atención.

Esa regla vuelve al color **raro por construcción**. Si solo aparece cuando algo
reclama atención, y casi nunca reclama nada, las pantallas quedan grises. Fue
textualmente la queja de Gonzalo: *"supermercado está muy gris, muy
monocromático"*. La respuesta de entonces —sumar un tono arena y darle un color
a cada módulo— trató el síntoma y dejó viva la causa.

El diagnóstico importa porque explica por qué ajustar tokens nunca alcanzó: el
problema no estaba en los valores sino en la regla que decidía dónde se usaban.

## La regla nueva

> **El color no marca urgencia: marca pertenencia.**
>
> Cada detalle que es *de este módulo* lleva su color, siempre. La urgencia la
> marcan el peso y el relleno —sólido contra lavado—, no la presencia o
> ausencia de color.

Consecuencia: la pantalla de Libros se ve verde aunque no haya nada urgente,
porque los íconos, las estrellas, los anillos de foco y las marcas son verdes.
El fondo sigue siendo papel: los fondos teñidos quedaron descartados
explícitamente.

## El brief

Minimalista · moderna · fresca · mobile first · que predomine el color
principal · con degradados permitidos · amigable · con personalidad · que se
sienta como un centro de orden.

Dos aclaraciones de Gonzalo que acotan el brief y evitan malinterpretarlo:

- **"Que predomine el color" son los detalles, no los fondos.** Estrellas,
  íconos, marcas chicas. Los fondos de color se descartaron por gronchos.
- **El carácter sale de la forma**, no de la tipografía. Se descartó la
  dirección editorial con serif: tira a editorial serio, no a fresco y
  amigable.

## Dónde vive el color

| Elemento | Tratamiento |
|---|---|
| Chip del ícono | Círculo con degradado del color, muy lavado; ícono al 100% |
| Estrellas llenas | Color sólido |
| Estado que reclama atención | Color **sólido** (relleno) |
| Estado normal | Color **lavado** (fondo tenue) |
| Anillo de foco | Color al 35% |
| Botón primario | Degradado sutil del color |
| Checks, switches, marcas | Color sólido |
| Contador del panel | Color sólido |
| Texto, líneas, papel | Tinta y neutros — **nunca** el color |

Los degradados van solo en piezas chicas —chips, botón primario, contador—, a
135° y entre dos variantes claras del color. Nunca en fondos de pantalla.

## Forma

Lo que produce lo "amigable":

- Radios más generosos: tarjetas 22px (hoy 18), chips completamente redondos.
- Sombras difusas en vez de duras.
- **Todo ícono siempre dentro de un chip redondo**, nunca suelto. Esa
  repetición del círculo teñido es la firma visual del sistema.

## Tipografía

Instrument Sans se queda: ya está self-hosteada y tiene eje de ancho. La escala
se mantiene contenida, con más aire entre bloques. Sin segunda familia.

## Color por módulo, elegido por el usuario

Cada módulo tiene un acento configurable desde Ajustes. El valor por defecto es
el salvia actual.

### Paleta curada

| Nombre | Hex |
|---|---|
| Salvia | `#4a7a5b` (por defecto) |
| Océano | `#2f7a86` |
| Índigo | `#4a5da8` |
| Ciruela | `#7a4a86` |
| Rosa | `#a84a72` |
| Ocre | `#8a6a2f` |

La paleta evita a propósito la zona del rojo y el terracota: ahí vive
`--danger` (`#a8503a`). Un módulo terracota haría que el botón de borrar se
confundiera con el resto de la pantalla.

### Modo avanzado

Detrás de un disclosure "Avanzado", un campo de hex libre.

**El color elegido no se corrige.** Si Gonzalo elige `#FFE600`, el amarillo
queda amarillo; lo que se calcula es **el texto encima** —tinta o blanco— según
la luminosidad OKLCH del color. Respeta la elección en vez de discutirla.

Único límite duro: un color casi blanco desaparecería sobre papel, así que el
chip del ícono aplica un piso de saturación.

### Derivación de los cinco valores

Un acento son cinco valores: base, hover, tinta encima, lavado y los dos
extremos del degradado. Se derivan del hex con sintaxis de color relativo de
CSS, de modo que los seis curados y cualquier hex del modo avanzado recorren el
mismo camino:

```css
--accent-wash: oklch(from var(--accent) calc(l + 0.32) calc(c * 0.35) h);
```

**Verificado en Chrome 150**: `oklch(from ...)`, `calc()` adentro y
`color-mix()` responden `true` a `CSS.supports`. Safari lo soporta desde 16.4,
pero **falta verificarlo en el iPhone real**, que es donde corre la app como
PWA. Si fallara, la alternativa es derivar los valores en build time: menos
elegante, mismo resultado visual, y el modo avanzado pasaría a resolverse en el
servidor al guardar.

## Persistencia

Tabla nueva, con la convención del resto del proyecto (RLS, `user_id` con
`default auth.uid()`, trigger de `updated_at`):

```sql
module_settings (user_id, module_id, accent, created_at, updated_at)
```

Se descartó localStorage: el color es una preferencia de Gonzalo, no del
dispositivo, y tiene que seguirlo del teléfono a la desktop.

### Cómo llega el color a la pantalla

Se lee **en el servidor**, en el layout de `(app)`, y se emite un único bloque
de estilo:

```css
[data-module="libros"]       { --accent: #4a5da8; }
[data-module="supermercado"] { --accent: #4a7a5b; }
```

Cada pantalla de módulo y cada tarjeta del panel llevan su `data-module` y
heredan el color por cascada. Dos consecuencias buenas: no hay parpadeo del
color por defecto al cargar, y el panel muestra cada módulo con su propio color
sin lógica adicional.

## Orden de trabajo

El trabajo no es parejo y conviene separarlo:

1. **Sistema visual** — toca casi todos los componentes. Se puede completar y
   evaluar con el acento fijo, antes de que exista la pantalla de Ajustes.
2. **Color por módulo** — migración, derivación de tokens, pantalla de Ajustes
   con paleta y modo avanzado.

## Fuera de alcance

- Adoptar shadcn como generador de componentes. Es una buena idea para los
  módulos futuros (trading y tareas van a necesitar tablas, date pickers y
  gráficos), pero el trabajo consiste en mapear nuestros tokens a los suyos:
  hacerlo antes de estabilizar los tokens garantiza retrabajo. Va después.
- Cambiar la tipografía.
- Fondos de pantalla teñidos o con degradado.
- Los módulos de trading y tareas.
