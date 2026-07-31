import { Suspense } from "react";
import {
  BellIcon,
  BookOpenIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Input, InlineInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { PageHeader } from "@/components/hubby/page-header";
import { StatTile } from "@/components/hubby/stat-tile";
import { EmptyState } from "@/components/hubby/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeFromQuery } from "@/components/theme-from-query";

export const metadata = { title: "Kitchen sink" };

// Clases literales: Tailwind extrae de forma estática y no resuelve
// `text-${token}` armado en runtime.
const TYPE_SCALE = [
  ["text-largetitle", "Large Title", "34 / 41"],
  ["text-title1", "Title 1", "28 / 34"],
  ["text-title2", "Title 2", "22 / 28"],
  ["text-title3", "Title 3", "20 / 25"],
  ["text-headline", "Headline", "17 / 22"],
  ["text-body", "Body", "17 / 22"],
  ["text-callout", "Callout", "16 / 21"],
  ["text-subhead", "Subhead", "15 / 20"],
  ["text-footnote", "Footnote", "13 / 18"],
  ["text-caption", "Caption", "12 / 16"],
  ["text-caption2", "Caption 2", "11 / 13"],
] as const;

const SURFACES = [
  ["background", "bg-background"],
  ["card", "bg-card"],
  ["fill", "bg-fill"],
  ["fill-tertiary", "bg-fill-tertiary"],
  ["primary", "bg-primary"],
  ["destructive", "bg-destructive"],
] as const;

export default function KitchenSink() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 pb-24">
      <Suspense>
        <ThemeFromQuery />
      </Suspense>

      <PageHeader
        title="Kitchen sink"
        subtitle="Componentes y estados del UI Kit"
        action={<ThemeToggle />}
      />

      <ListGroup
        title="Tipografía · fuente de sistema"
        footer="En Mac y iPhone esto es la San Francisco real que renderiza el OS."
      >
        {TYPE_SCALE.map(([cls, label, spec], i) => (
          <ListRow
            key={cls}
            last={i === TYPE_SCALE.length - 1}
            label={<span className={cls}>{label}</span>}
            trailing={<span className="text-footnote">{spec}</span>}
          />
        ))}
      </ListGroup>

      <section className="flex flex-col">
        <h2 className="text-footnote text-muted-foreground px-4 pb-1.5 uppercase">
          Superficies
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {SURFACES.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div
                className={`${cls} border-separator h-14 rounded-md border`}
                aria-hidden
              />
              <span className="text-caption2 text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-footnote text-muted-foreground px-4 uppercase">
          Botones
        </h2>
        <div className="flex flex-wrap items-center gap-2 px-4">
          <Button variant="filled">Filled</Button>
          <Button variant="tinted">Tinted</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="destructive">Borrar</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="px-4">
          <Button block size="lg">
            Ancho completo
          </Button>
        </div>
      </section>

      <ListGroup title="Controles">
        <ListRow
          label="Checkbox"
          trailing={
            <div className="flex items-center gap-3">
              <Checkbox aria-label="Sin marcar" />
              <Checkbox defaultChecked aria-label="Marcado" />
            </div>
          }
        />
        <ListRow
          label="Switch"
          trailing={
            <div className="flex items-center gap-3">
              <Switch aria-label="Apagado" />
              <Switch defaultChecked aria-label="Encendido" />
            </div>
          }
        />
        <ListRow
          label={
            <InlineInput
              placeholder="Campo dentro de una fila"
              aria-label="Campo inline"
            />
          }
        />
        <ListRow
          last
          label="Contadores"
          trailing={
            <div className="flex items-center gap-2">
              <Badge>3</Badge>
              <Badge variant="primary">12</Badge>
              <Badge variant="destructive">!</Badge>
            </div>
          }
        />
      </ListGroup>

      <section className="flex flex-col gap-3">
        <h2 className="text-footnote text-muted-foreground px-4 uppercase">
          Campo suelto
        </h2>
        <div className="flex flex-col gap-2 px-4">
          <Input placeholder="Campo vacío" aria-label="Vacío" />
          <Input defaultValue="Con contenido" aria-label="Con contenido" />
        </div>
      </section>

      <section className="flex flex-col">
        <h2 className="text-footnote text-muted-foreground px-4 pb-1.5 uppercase">
          Métricas
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="PnL mes" value="+4,2%" tone="positive" hint="12 ops" />
          <StatTile label="Racha" value="−1,8%" tone="negative" hint="3 ops" />
          <StatTile label="Leídos" value="24" hint="este año" />
        </div>
      </section>

      <ListGroup
        title="Lista agrupada"
        footer="El separador arranca alineado con el texto, no con el borde."
      >
        <ListRow
          interactive
          leading={<ShoppingCartIcon size={22} className="text-primary" />}
          label="Lista del súper"
          detail="3 pendientes"
          trailing={<Badge variant="primary">3</Badge>}
        />
        <ListRow
          interactive
          leading={<BookOpenIcon size={22} className="text-primary" />}
          label="Libros"
          detail="Leyendo 2"
        />
        <ListRow
          last
          interactive
          leading={<ChartLineUpIcon size={22} className="text-primary" />}
          label="Trading"
          trailing={<span className="text-positive">+4,2%</span>}
        />
      </ListGroup>

      <ListGroup title="Sin elemento a la izquierda">
        <ListRow
          label="Notificaciones"
          trailing={<Switch aria-label="Notificaciones" />}
        />
        <ListRow
          label="Sonido"
          trailing={<Switch defaultChecked aria-label="Sonido" />}
        />
        <ListRow last interactive label="Acerca de hubby" detail="Versión 0.1.0" />
      </ListGroup>

      <div className="bg-card rounded-md">
        <EmptyState
          icon={CheckCircleIcon}
          title="Todo en orden"
          description="No tenés nada pendiente en este módulo."
          action={
            <Button variant="tinted" size="sm">
              Agregar
            </Button>
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-footnote text-muted-foreground px-4 uppercase">
          Cristal (tab bar)
        </h2>
        <div className="relative h-28 overflow-hidden rounded-md">
          <div className="from-primary to-destructive absolute inset-0 bg-gradient-to-br" />
          <div className="glass border-glass-border absolute inset-x-0 bottom-0 flex h-14 items-center justify-around border-t">
            {[ShoppingCartIcon, BookOpenIcon, BellIcon].map((Ico, i) => (
              <Ico
                key={i}
                size={26}
                weight={i === 0 ? "fill" : "regular"}
                className={i === 0 ? "text-primary" : "text-muted-foreground"}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
