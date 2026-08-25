import type { Metadata } from "next";
import { Karla, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { ConsentScripts } from "@/components/consent-scripts";
import "./globals.css";

const karla = Karla({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Savoury — Partage tes recettes",
    template: "%s · Savoury",
  },
  description:
    "Savoury, le réseau social culinaire. Partage tes recettes, inspire-toi des autres gourmands et fais saliver ta communauté.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${karla.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
        <CookieBanner />
        <ConsentScripts />
      </body>
    </html>
  );
}