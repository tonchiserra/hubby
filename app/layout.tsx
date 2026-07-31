import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Sin webfonts a propósito: el stack de sistema resuelve a la San Francisco
// real en Mac y iPhone. Cero bytes, cero requests y exacto por definición.

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
  themeColor: "#f2f2f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
