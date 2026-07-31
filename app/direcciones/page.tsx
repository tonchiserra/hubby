import {
  ArrowUpRightIcon,
  BasketIcon,
  BookOpenIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";

import { DIRECCIONES, EN_CASA, FALTAN, type Direccion } from "./tokens";

export const metadata = { title: "Direcciones visuales" };

/**
 * Comparación de las tres direcciones visuales derivadas de las referencias.
 *
 * El markup es idéntico para las tres y lo único que cambia son las variables
 * CSS de cada una: así la comparación es honesta y no queda contaminada por
 * diferencias de contenido o de maquetado.
 *
 * Es una ruta de trabajo, no parte de la app. Se borra cuando Gonzalo elija.
 */
export default function DireccionesPage() {
  return (
    <main className="min-h-dvh bg-neutral-900 px-4 py-10">
      <header className="mx-auto mb-8 max-w-5xl text-neutral-300">
        <h1 className="text-2xl font-semibold text-white">
          Tres direcciones para hubby
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Derivadas de tus referencias, maquetadas con tus productos reales.
        </p>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {DIRECCIONES.map((d) => (
          <Muestra key={d.id} d={d} />
        ))}
      </div>
    </main>
  );
}

function Muestra({ d }: { d: Direccion }) {
  const mono = d.numeros === "mono";

  return (
    <section className="flex flex-col gap-3">
      <div className="text-neutral-300">
        <h2 className="text-lg font-semibold text-white">{d.nombre}</h2>
        <p className="max-w-2xl text-sm text-neutral-400">{d.tesis}</p>
      </div>

      <div
        style={{ ...d.vars, background: "var(--d-canvas)" } as React.CSSProperties}
        className="overflow-hidden rounded-xl"
      >
        <div
          className="flex flex-col gap-5 p-6"
          style={{ color: "var(--d-ink)" }}
        >
          {/* --- Encabezado del panel --- */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[28px] leading-tight font-bold tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Hubby
              </p>
              <p className="text-sm" style={{ color: "var(--d-ink-soft)" }}>
                Todo en un solo lugar
              </p>
            </div>
            <div
              className="flex h-9 items-center gap-2 px-3 text-sm"
              style={{
                background: "var(--d-card)",
                borderRadius: "999px",
                color: "var(--d-ink-soft)",
                boxShadow: d.sombra || undefined,
                border: d.sombra ? undefined : "1px solid var(--d-line)",
              }}
            >
              <MagnifyingGlassIcon size={15} weight="bold" />
              Buscar
            </div>
          </div>

          {/* --- Fila de métricas: cómo se va a ver trading --- */}
          <div className="grid grid-cols-3 gap-3">
            <Metrica d={d} etiqueta="Para comprar" valor="2" delta={null} destacada />
            <Metrica d={d} etiqueta="PnL del mes" valor="+4,2%" delta="12 ops" />
            <Metrica d={d} etiqueta="Leídos" valor="24" delta="este año" />
          </div>

          {/* --- Tarjetas de módulo --- */}
          <div className="grid grid-cols-3 gap-3">
            <TarjetaModulo
              d={d}
              icono={<BasketIcon size={20} weight="regular" />}
              titulo="Supermercado"
              detalle="2 para comprar"
              badge="2"
              items={FALTAN}
              resaltada={d.id === "caracter"}
            />
            <TarjetaModulo
              d={d}
              icono={<ChartLineUpIcon size={20} weight="regular" />}
              titulo="Trading"
              detalle="12 operaciones"
              valor="+4,2%"
              mono={mono}
            />
            <TarjetaModulo
              d={d}
              icono={<BookOpenIcon size={20} weight="regular" />}
              titulo="Libros"
              detalle="Leyendo 1"
              items={["Los detectives salvajes"]}
            />
          </div>

          {/* --- Lista: el caso que las referencias no cubren --- */}
          <div
            className="overflow-hidden"
            style={{
              background: "var(--d-card)",
              borderRadius: "var(--d-radius-card)",
              boxShadow: d.sombra || undefined,
              border: d.sombra ? undefined : "1px solid var(--d-line)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 pt-4 pb-2"
              style={{ color: "var(--d-ink-soft)" }}
            >
              <span className="text-xs font-semibold tracking-wide uppercase">
                Supermercado
              </span>
              <span className="text-xs">4 productos</span>
            </div>

            {FALTAN.map((n) => (
              <Fila key={n} d={d} nombre={n} falta />
            ))}
            {EN_CASA.map((n, i) => (
              <Fila
                key={n}
                d={d}
                nombre={n}
                ultima={i === EN_CASA.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metrica({
  d,
  etiqueta,
  valor,
  delta,
  destacada,
}: {
  d: Direccion;
  etiqueta: string;
  valor: string;
  delta: string | null;
  destacada?: boolean;
}) {
  // Una métrica pintada entera es el recurso que usan dos de las tres
  // referencias para marcar lo que reclama atención.
  const invertida = destacada;

  return (
    <div
      className="flex flex-col gap-1 p-4"
      style={{
        background: invertida ? "var(--d-accent)" : "var(--d-card)",
        color: invertida ? "#fff" : "var(--d-ink)",
        borderRadius: "var(--d-radius-card)",
        boxShadow: d.sombra || undefined,
        border: d.sombra ? undefined : "1px solid var(--d-line)",
      }}
    >
      <span
        className="text-[11px] font-medium tracking-wide uppercase"
        style={{ color: invertida ? "rgb(255 255 255 / 0.75)" : "var(--d-ink-soft)" }}
      >
        {etiqueta}
      </span>
      <span
        className={`text-[26px] leading-none font-bold tracking-tight ${
          d.numeros === "mono" ? "font-mono" : ""
        }`}
      >
        {valor}
      </span>
      {delta && (
        <span
          className="text-[11px]"
          style={{ color: invertida ? "rgb(255 255 255 / 0.75)" : "var(--d-ink-soft)" }}
        >
          {delta}
        </span>
      )}
    </div>
  );
}

function TarjetaModulo({
  d,
  icono,
  titulo,
  detalle,
  badge,
  valor,
  items,
  mono,
  resaltada,
}: {
  d: Direccion;
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
  badge?: string;
  valor?: string;
  items?: string[];
  mono?: boolean;
  resaltada?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{
        background: resaltada ? "var(--d-warm)" : "var(--d-card)",
        borderRadius: "var(--d-radius-card)",
        boxShadow: d.sombra || undefined,
        border: d.sombra ? undefined : "1px solid var(--d-line)",
      }}
    >
      <div className="flex items-start justify-between">
        {/* Ícono dentro de un círculo teñido: está en las tres referencias. */}
        <span
          className="grid size-9 place-items-center"
          style={{
            background: "var(--d-accent-soft)",
            color: "var(--d-accent)",
            borderRadius: "999px",
          }}
        >
          {icono}
        </span>
        {badge && (
          <span
            className="grid size-6 place-items-center text-[11px] font-bold text-white"
            style={{ background: "var(--d-accent)", borderRadius: "999px" }}
          >
            {badge}
          </span>
        )}
        {valor && (
          <span
            className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}
            style={{ color: "var(--d-accent)" }}
          >
            {valor}
          </span>
        )}
      </div>

      {items && (
        <ul className="flex flex-col gap-0.5 text-[13px]">
          {items.map((i) => (
            <li key={i} className="truncate">
              {i}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{titulo}</p>
          <p className="truncate text-[12px]" style={{ color: "var(--d-ink-soft)" }}>
            {detalle}
          </p>
        </div>
        <CaretRightIcon
          size={13}
          weight="bold"
          style={{ color: "var(--d-ink-soft)", opacity: 0.6 }}
        />
      </div>
    </div>
  );
}

function Fila({
  d,
  nombre,
  falta,
  ultima,
}: {
  d: Direccion;
  nombre: string;
  falta?: boolean;
  ultima?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{
        borderBottom: ultima ? undefined : "1px solid var(--d-line)",
      }}
    >
      <span
        className="grid size-6 shrink-0 place-items-center"
        style={{
          borderRadius: "999px",
          background: falta ? "transparent" : "var(--d-accent)",
          border: falta ? "1.5px solid var(--d-line)" : undefined,
          color: "#fff",
        }}
      >
        {!falta && <CheckIcon size={13} weight="bold" />}
      </span>

      <span
        className="flex-1 truncate text-[15px]"
        style={{
          color: falta ? "var(--d-ink)" : "var(--d-ink-soft)",
          fontWeight: falta ? 500 : 400,
        }}
      >
        {nombre}
      </span>

      {falta && (
        <span
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
          style={{
            background: "var(--d-warm)",
            color: "var(--d-danger)",
            borderRadius: "999px",
          }}
        >
          <ArrowUpRightIcon size={9} weight="bold" />
          Falta
        </span>
      )}
    </div>
  );
}
