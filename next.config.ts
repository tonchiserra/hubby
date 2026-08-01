import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fijado a mano porque hay un package-lock.json vacío en el home del
    // usuario y, sin esto, Next infiere /Users/tonchi como raíz del workspace.
    // Se usa cwd y no import.meta.url: Next compila este archivo a una ruta
    // temporal, así que import.meta.url no apunta a la carpeta del proyecto y
    // rompe la resolución de módulos.
    root: process.cwd(),
  },
};

export default nextConfig;
