import UnregisterStaleWorkers from "@/components/UnregisterStaleWorkers";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SafeCom",
  description: "Prospection commerciale, pipeline et conversion",
  icons: {
    icon: "data:,",
    shortcut: "data:,",
    apple: "/app-icon-192.png",
  },
  // Lancée depuis l’écran d’accueil, l’app s’ouvre sans la barre du navigateur.
  appleWebApp: { capable: true, title: "SafeCom", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Laisse le contenu passer sous l’encoche ; les marges sûres sont gérées en CSS.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141814" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={outfit.variable} suppressHydrationWarning>
      <body className={outfit.className}>
        <Script
          id="safecheck-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <UnregisterStaleWorkers />
        {children}
      </body>
    </html>
  );
}
