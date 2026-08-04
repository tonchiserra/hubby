import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// El origen de Supabase sale del entorno. Si falta, el proyecto no está
// configurado y la app ya redirige a /setup: no hay a quién dejar entrar.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Con quién puede hablar la app y de dónde puede traer cosas.
 *
 * `script-src` lleva 'unsafe-inline' porque Next y next-themes inyectan
 * scripts sin nonce. Nonces por request se generarían en proxy.ts, que es el
 * archivo más frágil del repo, y quedan como paso aparte. Lo que esta CSP sí
 * compra hoy es clickjacking, el control de a dónde puede hablar la app y la
 * imposibilidad de cargar recursos en claro.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // hubby nunca se muestra dentro de un iframe: no hay nada que embeber, y sí
  // una sesión que robar con un clic superpuesto.
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Las portadas se pegan a mano desde cualquier dominio: es una función del
  // editor de libros, no un descuido. Se limita a https, que descarta el
  // tráfico en claro.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Tailwind viaja como hoja, pero varios componentes calculan medidas con el
  // atributo style y eso también cae bajo style-src.
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  [
    "connect-src 'self'",
    supabase,
    // La búsqueda de libros pega directo desde el navegador.
    "https://openlibrary.org",
    // El recargado en caliente de Next habla por websocket.
    dev ? "ws:" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    // Fijado a mano porque hay un package-lock.json vacío en el home del
    // usuario y, sin esto, Next infiere /Users/tonchi como raíz del workspace.
    // Se usa cwd y no import.meta.url: Next compila este archivo a una ruta
    // temporal, así que import.meta.url no apunta a la carpeta del proyecto y
    // rompe la resolución de módulos.
    root: process.cwd(),
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // frame-ancestors ya lo dice; esto es para navegadores que no leen CSP.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Sin `preload`: entrar a la lista de precarga de los navegadores es
          // fácil y salir no, y no hace falta para una app personal.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
