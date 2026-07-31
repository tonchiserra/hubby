"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

/**
 * Permite forzar el tema desde la URL (`?theme=dark`) para revisión de diseño:
 * hace que cada modo tenga un link propio, compartible y capturable.
 */
export function ThemeFromQuery() {
  const params = useSearchParams();
  const { setTheme } = useTheme();
  const requested = params.get("theme");

  useEffect(() => {
    if (requested === "dark" || requested === "light") setTheme(requested);
  }, [requested, setTheme]);

  return null;
}
