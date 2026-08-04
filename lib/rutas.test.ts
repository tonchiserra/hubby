import { describe, expect, it } from "vitest";
import { rutaInterna } from "@/lib/rutas";

describe("rutaInterna", () => {
  it("deja pasar una ruta del sitio", () => {
    expect(rutaInterna("/tareas")).toBe("/tareas");
  });

  it("conserva query y ancla", () => {
    expect(rutaInterna("/libros?q=dune#top")).toBe("/libros?q=dune#top");
  });

  it("manda a la home cuando no viene nada", () => {
    expect(rutaInterna(undefined)).toBe("/");
    expect(rutaInterna(null)).toBe("/");
    expect(rutaInterna("")).toBe("/");
  });

  it("rechaza una URL absoluta", () => {
    expect(rutaInterna("https://evil.com")).toBe("/");
    expect(rutaInterna("http://evil.com")).toBe("/");
  });

  // Las dos que pasaban el chequeo viejo de startsWith("/"): el navegador las
  // resuelve como absolutas y te saca del sitio.
  it("rechaza la URL sin protocolo", () => {
    expect(rutaInterna("//evil.com")).toBe("/");
    expect(rutaInterna("//evil.com/robar")).toBe("/");
  });

  it("rechaza la contrabarra, que el navegador normaliza a doble barra", () => {
    expect(rutaInterna("/\\evil.com")).toBe("/");
  });

  it("rechaza una ruta sin barra inicial", () => {
    expect(rutaInterna("tareas")).toBe("/");
  });

  it("deja pasar la home", () => {
    expect(rutaInterna("/")).toBe("/");
  });
});
