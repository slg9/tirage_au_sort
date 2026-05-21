import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuroraBackground } from "@/components/shared/AuroraBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tirage au Sort — Fortune Wheel",
  description: "Organisez des tirages au sort multi-cycles avec une roue de la fortune animée",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-sans bg-slate-950 text-white min-h-screen antialiased`}>
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
