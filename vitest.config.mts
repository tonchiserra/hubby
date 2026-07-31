import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo lógica pura por ahora: sin DOM, sin jsdom.
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Vite carga este archivo desde su ubicación real, así que import.meta.url
      // apunta a la carpeta del proyecto. Ojo: en next.config.ts NO se puede
      // hacer esto, porque Next lo compila a una ruta temporal y la resolución
      // de módulos se rompe. Son casos opuestos a propósito.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
