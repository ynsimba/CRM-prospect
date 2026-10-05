import UnregisterStaleWorkers from "@/components/UnregisterStaleWorkers";
import type { Metadata } from "next";
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
    apple: "data:,",
  },
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
