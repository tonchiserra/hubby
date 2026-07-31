import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/**
 * Instrument Sans tiene ejes de peso y de ancho. Toda la jerarquía sale de esa
 * única familia: los títulos van condensados y con peso, el cuerpo en ancho
 * normal. No hace falta una segunda tipografía para dar carácter.
 *
 * next/font la descarga en build time y la self-hostea: sin request a Google
 * en runtime y sin salto de layout.
 */
const instrument = Instrument_Sans({
  variable: "--font-instrument",
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
  themeColor: "#f3f2ed",
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
      className={`${instrument.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
