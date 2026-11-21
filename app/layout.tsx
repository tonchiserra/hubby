import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Mona_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/**
 * Reemplazos libres de las fuentes con licencia del UI Kit de COSRX, los
 * mismos que usa Platita: Hanken Grotesk por Maison Neue (texto) y Mona Sans
 * por Maison Neue Extended (titulares expandidos y cifras en bold). Las del
 * kit son licencia del cliente y no se usan acá.
 *
 * next/font las descarga en build time y las self-hostea: sin request a
 * Google en runtime y sin salto de layout.
 */
const texto = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const display = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "hubby",
    template: "%s · hubby",
  },
  description: "Tu hub personal: todo lo que trackeás, en un solo lugar.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "hubby",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // La app arranca en claro sin importar la preferencia del SO; a partir de
  // ahí ThemeColorSync lo actualiza según el tema elegido.
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${texto.variable} ${display.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
