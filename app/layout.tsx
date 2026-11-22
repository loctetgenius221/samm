import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const atkinson = localFont({
  src: "./fonts/AtkinsonHyperlegibleNext-Variable.woff2",
  weight: "200 800",
  variable: "--font-atkinson",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fa" },
    { media: "(prefers-color-scheme: dark)", color: "#111230" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Sàmm : vérifier un message suspect",
    template: "%s | Sàmm",
  },
  description: "Collez un message ou une capture : Sàmm repère les arnaques au mobile money et vous dit quoi faire.",
  applicationName: "Sàmm",
  icons: {
    icon: "/logo.svg",
    apple: "/icons/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sàmm",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${atkinson.variable} antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
