import { describe, expect, it } from "vitest";
import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import { partitionByUrgency, type ModulePanelEntry } from "./summary";
import type { ModuleDefinition } from "./types";

function mod(id: string, label: string): ModuleDefinition {
  return {
    id,
    slug: id,
    label,
    icon: BasketIcon,
    description: "",
    accent: {
      solid: "#000",
      ink: "#fff",
      wash: "#eee",
      solidDark: "#fff",
      washDark: "#111",
    },
  };
}

function entry(id: string, label: string, urgency: number): ModulePanelEntry {
  return {
    module: mod(id, label),
    summary: { urgency, detail: "", preview: [] },
  };
}

describe("partitionByUrgency", () => {
  it("separa los que reclaman atención de los que están en cero", () => {
    const { active, quiet } = partitionByUrgency([
      entry("libros", "Libros", 0),
      entry("super", "Supermercado", 3),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["super"]);
    expect(quiet.map((e) => e.module.id)).toEqual(["libros"]);
  });

  it("ordena los activos por urgencia descendente", () => {
    const { active } = partitionByUrgency([
      entry("a", "A", 2),
      entry("b", "B", 9),
      entry("c", "C", 5),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["b", "c", "a"]);
  });

  it("desempata por etiqueta para que el orden no baile entre cargas", () => {
    const { active } = partitionByUrgency([
      entry("z", "Zapatos", 4),
      entry("a", "Agenda", 4),
    ]);

    expect(active.map((e) => e.module.id)).toEqual(["a", "z"]);
  });

  it("ordena los callados alfabéticamente, sin mirar la urgencia", () => {
    const { quiet } = partitionByUrgency([
      entry("z", "Zapatos", 0),
      entry("a", "Agenda", 0),
    ]);

    expect(quiet.map((e) => e.module.id)).toEqual(["a", "z"]);
  });

  it("no muta el array que recibe", () => {
    const entries = [entry("a", "A", 1), entry("b", "B", 9)];
    partitionByUrgency(entries);

    expect(entries.map((e) => e.module.id)).toEqual(["a", "b"]);
  });

  it("devuelve dos listas vacías si no hay módulos", () => {
    expect(partitionByUrgency([])).toEqual({ active: [], quiet: [] });
  });
});
