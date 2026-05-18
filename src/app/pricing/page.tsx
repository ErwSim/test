import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Tarifs",
  description: "29 €/mois pour les agents indépendants, 79 €/mois pour les agences.",
};

const plans = [
  {
    name: "Découverte",
    price: "0 €",
    note: "Sans carte bancaire",
    features: [
      "3 annonces gratuites",
      "Tous les formats",
      "DPE auto ADEME",
      "Conformité légale",
    ],
    cta: "Essayer maintenant",
    href: "/generate",
  },
  {
    name: "Solo",
    price: "29 €",
    note: "HT / mois — agent indépendant",
    features: [
      "Annonces illimitées",
      "5 formats simultanés",
      "DPE auto ADEME",
      "Conformité légale garantie",
      "Historique 90 jours",
      "Support par email",
    ],
    cta: "S'abonner Solo",
    href: "/generate",
    highlight: true,
  },
  {
    name: "Agence",
    price: "79 €",
    note: "HT / mois — équipes (5 sièges)",
    features: [
      "Tout Solo, plus :",
      "Multi-utilisateurs (5 sièges)",
      "Import batch CSV illimité",
      "Connecteurs Apimo / Hektor",
      "API REST + webhooks",
      "Support prioritaire (4 h ouvrées)",
      "Branding agence personnalisable",
    ],
    cta: "Choisir Agence",
    href: "/generate",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Accueil
      </Link>
      <h1 className="mt-6 text-4xl font-bold">Tarifs simples, pensés pour vous rembourser</h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        Annoncia se rentabilise dès le 1<sup>er</sup> mandat du mois. Sans engagement.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`flex flex-col rounded-2xl border p-6 ${
              p.highlight
                ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
                : "border-[var(--color-border)]"
            }`}
          >
            {p.highlight ? (
              <span className="mb-3 inline-block w-fit rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent-foreground)]">
                Le plus choisi
              </span>
            ) : null}
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="mt-3 text-4xl font-bold">{p.price}</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{p.note}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href={p.href}>
                <Button className="w-full" variant={p.highlight ? "primary" : "secondary"}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-8">
        <h2 className="text-2xl font-bold">Pourquoi ces tarifs sont rentables pour vous</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold">Solo · 29 €</p>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              25 min économisées par mandat × 8 mandats/mois = 3 h 20 min. À 60 €/h, vous récupérez
              200 € de temps de travail.
            </p>
          </div>
          <div>
            <p className="font-semibold">Agence · 79 €</p>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              5 agents × 12 mandats × 25 min = 25 h économisées/mois. Soit 1 500 € de
              productivité, pour 79 €.
            </p>
          </div>
          <div>
            <p className="font-semibold">Risque évité</p>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              Une amende DGCCRF pour mention DPE manquante : jusqu'à 3 000 €. Annoncia la met
              automatiquement, à chaque annonce.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
