import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

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
      "@": root,

      // `server-only` es un paquete marcador: su entrypoint por defecto es un
      // throw, y solo devuelve el módulo vacío bajo la condición de exports
      // `react-server`, que Vitest no activa. Sin este alias, cualquier test
      // que alcance un archivo de servidor revienta al importarlo.
      //
      // Se apunta al mismo `empty.js` que usaría Next, en vez de agregar
      // "react-server" a resolve.conditions: esa condición también cambia qué
      // build de React se resuelve, y arrastraría efectos que no queremos.
      "server-only": `${root}node_modules/server-only/empty.js`,
    },
  },
});
