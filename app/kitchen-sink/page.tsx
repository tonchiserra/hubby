import { Suspense } from "react";
import {
  BookOpenIcon,
  ChartLineUpIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { PageHeader } from "@/components/hubby/page-header";
import { StatTile } from "@/components/hubby/stat-tile";
import { EmptyState } from "@/components/hubby/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeFromQuery } from "@/components/theme-from-query";

export const metadata = { title: "Kitchen sink" };

// Las clases van literales: Tailwind extrae de forma estática y no puede
// resolver `text-${token}` construido en runtime.
const TYPE_SCALE = [
  ["text-largetitle", "Large Title", "34 / 41"],
  ["text-title1", "Title 1", "28 / 34"],
  ["text-title2", "Title 2", "22 / 28"],
  ["text-title3", "Title 3", "20 / 25"],
  ["text-headline", "Headline", "17 / 22 · 600"],
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
  ["muted", "bg-muted"],
  ["primary", "bg-primary"],
  ["accent", "bg-accent"],
  ["destructive", "bg-destructive"],
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-caption text-muted-foreground font-medium uppercase tracking-widest">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function KitchenSink() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-8 pb-24">
      <Suspense>
        <ThemeFromQuery />
      </Suspense>
      <PageHeader
        title="Kitchen sink"
        subtitle="Todos los componentes y estados del UI Kit"
        action={<ThemeToggle />}
      />

      <Section title="Tipografía · DM Sans">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            {TYPE_SCALE.map(([cls, label, spec]) => (
              <div key={cls} className="flex items-baseline justify-between gap-4">
                <span className={`${cls} truncate`}>{label}</span>
                <span className="text-caption2 text-muted-foreground shrink-0 font-mono">
                  {spec}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section title="Superficies">
        <div className="grid grid-cols-3 gap-2">
          {SURFACES.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div
                className={`${cls} border-border h-16 rounded-lg border`}
                aria-hidden
              />
              <span className="text-caption2 text-muted-foreground font-mono">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Botones">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary">Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="plain">Plain</Button>
              <Button variant="destructive">Borrar</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Agregar">
                <PlusIcon size={22} weight="bold" />
              </Button>
              <Button disabled>Deshabilitado</Button>
            </div>
            <Button block size="lg">
              <PlusIcon size={20} weight="bold" />
              Ancho completo
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Formulario">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Input placeholder="Campo vacío" />
            <Input defaultValue="Con contenido" />
            <Input disabled placeholder="Deshabilitado" />
            <div className="flex items-center justify-between pt-1">
              <span className="text-body">Checkbox</span>
              <div className="flex items-center gap-3">
                <Checkbox aria-label="Sin marcar" />
                <Checkbox defaultChecked aria-label="Marcado" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Switch</span>
              <div className="flex items-center gap-3">
                <Switch aria-label="Apagado" />
                <Switch defaultChecked aria-label="Encendido" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Badges">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 pt-4">
            <Badge>Neutral</Badge>
            <Badge variant="accent">Acento</Badge>
            <Badge variant="positive">+4,2%</Badge>
            <Badge variant="negative">−1,8%</Badge>
            <Badge size="sm">Small</Badge>
          </CardContent>
        </Card>
      </Section>

      <Section title="Métricas">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="PnL mes" value="+4,2%" tone="positive" hint="12 ops" />
          <StatTile label="Racha" value="−1,8%" tone="negative" hint="3 ops" />
          <StatTile label="Leídos" value="24" hint="este año" />
        </div>
      </Section>

      <Section title="Lista agrupada">
        <div className="flex flex-col gap-6">
          <ListGroup title="Módulos">
            <ListRow
              interactive
              leading={<ShoppingCartIcon size={22} className="text-primary" />}
              label="Lista del súper"
              detail="3 pendientes"
              trailing={<Badge variant="accent">3</Badge>}
            />
            <ListRow
              interactive
              leading={<BookOpenIcon size={22} className="text-primary" />}
              label="Libros"
              detail="Leyendo 2"
            />
            <ListRow
              interactive
              leading={<ChartLineUpIcon size={22} className="text-primary" />}
              label="Trading"
              detail="12 operaciones este mes"
              trailing={<span className="text-positive font-mono">+4,2%</span>}
            />
          </ListGroup>

          <ListGroup title="Con checkbox">
            <ListRow leading={<Checkbox aria-label="Leche" />} label="Leche" />
            <ListRow leading={<Checkbox aria-label="Pan" />} label="Pan" detail="2 unidades" />
            <ListRow
              leading={<Checkbox defaultChecked aria-label="Café" />}
              label={<span className="text-muted-foreground line-through">Café</span>}
            />
          </ListGroup>
        </div>
      </Section>

      <Section title="Estado vacío">
        <Card>
          <EmptyState
            icon={CheckCircleIcon}
            title="Todo en orden"
            description="No tenés nada pendiente en este módulo. Cuando agregues algo, aparece acá."
            action={
              <Button size="sm">
                <PlusIcon size={16} weight="bold" />
                Agregar
              </Button>
            }
          />
        </Card>
      </Section>

      <Section title="Cristal (tab bar)">
        <div className="relative h-32 overflow-hidden rounded-xl">
          <div className="from-primary to-destructive absolute inset-0 bg-gradient-to-br" />
          <div className="glass border-glass-border absolute inset-x-0 bottom-0 flex h-16 items-center justify-around border-t">
            {[ShoppingCartIcon, BookOpenIcon, ChartLineUpIcon].map((Ico, i) => (
              <Ico
                key={i}
                size={26}
                weight={i === 0 ? "fill" : "regular"}
                className={i === 0 ? "text-primary" : "text-muted-foreground"}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Tarjeta con header">
        <Card>
          <CardHeader>
            <CardTitle>Título de tarjeta</CardTitle>
          </CardHeader>
          <CardContent className="text-subhead text-muted-foreground">
            Contenido de ejemplo para verificar el ritmo vertical y el espaciado
            interno de la tarjeta.
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
