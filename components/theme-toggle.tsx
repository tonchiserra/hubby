"use client";

import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="quiet"
      size="icon"
      // La etiqueta nombra la acción y no el destino, así no depende del tema
      // activo -que en el servidor todavía no se conoce.
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Se renderizan los dos íconos y decide CSS según la clase .dark del
          <html>. Así el servidor y el cliente pintan lo mismo y no hace falta
          un estado de "ya monté": ese estado además dejaba el botón vacío en el
          primer pintado, hasta que corría el efecto. */}
      <MoonIcon size={22} className="dark:hidden" />
      <SunIcon size={22} className="hidden dark:block" />
    </Button>
  );
}
