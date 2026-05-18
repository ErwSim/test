import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Annoncia — Annonces immobilières IA, conformes & vendeuses",
    template: "%s · Annoncia",
  },
  description:
    "Générez en 10 secondes des annonces immobilières optimisées SEO, légalement conformes (DPE, LCAP, loi Carrez) et déclinées pour SeLoger, LeBonCoin, Instagram et brochures PDF.",
  keywords: [
    "annonce immobilière IA",
    "générateur annonce immobilier",
    "rédaction annonce immobilier",
    "DPE annonce",
    "agent immobilier outil IA",
  ],
  openGraph: {
    title: "Annoncia — Annonces immobilières IA",
    description:
      "Rédigez vos annonces immobilières en 10s : conformes, optimisées SEO, multi-format.",
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
