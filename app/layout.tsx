import type { Metadata, Viewport } from "next";
import { DM_Sans, Google_Sans_Code } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// next/font descarga en build time y self-hostea: sin request a Google en
// runtime, sin DNS extra y sin layout shift.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

// Google Sans Code es lo único de la familia Google Sans con licencia abierta
// (OFL). Monoespaciada, reservada para cifras: PnL, cantidades, importes.
const gsCode = Google_Sans_Code({
  variable: "--font-gs-code",
  subsets: ["latin"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f0ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
  // La app se instala como PWA: sin zoom y respetando el notch.
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
      className={`${dmSans.variable} ${gsCode.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
