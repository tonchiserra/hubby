# Rediseño de la UI de hubby

Fecha: 2026-07-31 · Estado: método aprobado, dirección visual pendiente de referencias

## Contexto

La interfaz de hubby se rehízo dos veces y ninguna convenció.

1. **Primera versión** — DM Sans, neutros cálidos de Radix `sand`, acento jade. Resultado: una app web genérica y agradable, sin voz propia.
2. **Segunda versión** — valores reales de iOS: fuente de sistema (San Francisco), system colors, radios de 10px, separadores indentados de un píxel físico. Técnicamente fiel, y el diagnóstico de Gonzalo fue exacto: *"al parecerse TANTO a iPadOS siento que tiene muy poca personalidad"*.

**La segunda falló por una razón estructural, no de ejecución: iOS está diseñado para desaparecer.** Apple lo hace deliberadamente neutro para que las apps resalten. Reproducirlo con fidelidad produce, por construcción, máxima neutralidad. Cuanto mejor salía la imitación, menos carácter tenía.

El patrón común de los dos intentos es el método: **el diseño se derivó de un sistema externo** —una paleta genérica primero, la especificación de Apple después— en vez de un punto de vista propio. La personalidad no se deriva de una especificación.

Esta vez el método cambia: la dirección visual sale de referencias que aporta Gonzalo.

### Lo que habilita rehacerlo

La capa visual son ~1.123 líneas —`globals.css` con 98 tokens, las primitivas de `components/ui/` y la capa propia de `components/hubby/`— y está completamente desacoplada del resto. El registry de módulos, las server actions, RLS y el vocabulario de movimiento no dependen del aspecto. Se puede tirar abajo la estética entera sin tocar lógica.

## Alcance

**Entra:** todas las pantallas. Panel, supermercado, ajustes, login, setup y kitchen-sink. Tokens, primitivas y capa propia.

**No entra:** la UX y los flujos actuales, que Gonzalo confirmó que funcionan. La navegación de pila, el modelo de inventario del supermercado, el buscador que también agrega y los gestos de swipe se conservan tal cual.

**Única excepción de UX**, aprobada aparte: el contenido del panel (ver abajo).

## Parte 1 — Dirección visual (bloqueada)

### Método

1. **Gonzalo junta 3 a 5 referencias** de cosas que le parezcan lindas. No necesitan ser apps de productividad ni parecerse entre sí: sirve una app de música, el sitio de un estudio, un afiche, un packaging, la interfaz de un auto. El criterio es el gusto propio, no la calidad de diseño reconocida.
2. Ayuda mandar además **algo que le parezca feo o aburrido**: saber qué rechaza acota más rápido que saber qué le gusta.
3. Se extrae qué tienen en común: densidad, rol de la tipografía, si el color es plano o texturado, qué hace el acento, si hay bordes o sombras o nada.
4. Se arman **tres direcciones maquetadas con datos reales del supermercado**, nunca con relleno. Comparar direcciones sobre contenido real es lo que evita elegir una que se cae al primer caso concreto.
5. Gonzalo elige una y se lleva a todas las pantallas.

### Regla que no se rompe

**No se proponen paletas, tipografías ni direcciones antes de tener las referencias.** Es exactamente lo que se hizo dos veces y produjo dos resultados descartados.

## Parte 2 — Contenido del panel (aprobada)

Hoy el panel muestra nombre de módulo, una línea de estado y un contador. Es un lanzador disfrazado de panel: obliga a entrar a cada módulo para saber cómo viene.

Pasa a mostrar **contenido real ordenado por urgencia**: los productos que faltan por su nombre, el libro que se está leyendo, el PnL del mes. Lo que requiere atención sube; lo resuelto se colapsa a una línea callada al final. Con seis módulos, los tres que no piden nada dejan de competir por la atención.

### La restricción que define la arquitectura

**No se puede a la vez transmitir los widgets a medida que llegan y ordenarlos por urgencia.** El orden no se conoce hasta que llegaron todos los datos; si cada widget aparece por su cuenta dentro de su propio `<Suspense>`, la lista se reacomoda sola mientras el usuario la mira.

Se elige **ordenar antes de pintar**: el panel pide un resumen barato de cada módulo, los espera en paralelo, ordena y recién entonces renderiza. Una sola pintura, sin saltos. La latencia total no empeora — sigue siendo la de la consulta más lenta, que es lo que da esperar en paralelo de todos modos.

### Contrato del registry

Cada módulo pasa a aportar dos cosas:

- `summary()` — consulta barata que devuelve `urgency: number` (0 = nada que hacer) más los datos compactos que se muestran.
- Un componente que recibe ese resumen **ya resuelto**, sin buscar nada por su cuenta.

El panel ordena por `urgency` descendente y colapsa los que están en 0.

Esto mantiene la separación que ya existe y que costó un error de build encontrar: `registry.ts` sigue siendo client-safe con solo metadata, y todo lo que toca la base queda del lado del servidor.

## Verificación

- **Visual:** las tres direcciones se maquetan y se comparan como capturas en claro y oscuro, en viewport de iPhone y de escritorio.
- **Panel:** con el módulo de supermercado en distintos estados —sin productos, con faltantes, todo en casa— el orden y el colapso responden como corresponde.
- **Sin regresiones:** `pnpm build` limpio, y las pruebas de RLS y del CRUD del supermercado siguen pasando.
- **Movimiento:** se respeta `lib/motion.ts`; los reacomodos del panel usan los mismos resortes que el resto.

## Estado

| Parte | Estado |
|---|---|
| Método de la dirección visual | Acordado |
| Referencias de Gonzalo | **Pendiente — bloquea toda la parte estética** |
| Contenido y orden del panel | Aprobado, se puede implementar ya |
| Alcance (todas las pantallas, UX intacta) | Aprobado |
