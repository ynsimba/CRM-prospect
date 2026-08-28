import UnregisterStaleWorkers from "@/components/UnregisterStaleWorkers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Prospect CRM",
  description: "Prospection commerciale, pipeline et conversion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={inter.className}>
        <UnregisterStaleWorkers />
        {children}
      </body>
    </html>
  );
}
