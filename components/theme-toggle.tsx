"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // El tema resuelto solo se conoce en cliente; sin esto el primer render
  // del servidor no coincide con el del navegador.
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="plain"
      size="icon"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && (isDark ? <SunIcon size={22} /> : <MoonIcon size={22} />)}
    </Button>
  );
}
