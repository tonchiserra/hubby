"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

/** Debe coincidir con --background de cada modo en globals.css. */
const CHROME_COLOR = { light: "#f2f2f7", dark: "#000000" } as const;

/**
 * Mantiene <meta name="theme-color"> en sincronía con el tema activo. Sin esto,
 * al instalar la PWA la barra de estado de iOS conserva el color del arranque y
 * queda desfasada del fondo real de la app.
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color =
      CHROME_COLOR[resolvedTheme === "dark" ? "dark" : "light"];
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      // Claro por defecto a propósito: la app no sigue la preferencia del SO,
      // arranca clara y el toggle manda a partir de ahí.
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  );
}
