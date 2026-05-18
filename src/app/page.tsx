import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    title: "Conforme LCAP, ALUR, Hoguet",
    desc: "Mentions DPE/GES, lots de copropriété, charges, honoraires location : chaque annonce respecte la loi française. Plus de risque d'amende ni de signalement.",
  },
  {
    title: "5 formats en 1 clic",
    desc: "SeLoger long, LeBonCoin court, caption Instagram, post Facebook, brochure PDF premium. Un seul brief, toutes les déclinaisons.",
  },
  {
    title: "DPE auto via l'ADEME",
    desc: "On interroge la base publique ADEME à partir de l'adresse. Vous gagnez 5 min par mandat et zéro erreur de saisie de classe énergétique.",
  },
  {
    title: "SEO local intégré",
    desc: "« T3 lumineux Bordeaux Caudéran proche tramway » plutôt que du générique ChatGPT. Vos annonces remontent sur les requêtes longue traîne.",
  },
  {
    title: "Import batch CSV / Apimo",
    desc: "Agences : importez 50 mandats d'un coup, générez toutes les annonces en 3 minutes. (Offre Agence)",
  },
  {
    title: "Pas d'invention",
    desc: "Le moteur ne brode pas sur ce que vous n'avez pas indiqué. Conforme à votre devoir d'information loyale.",
  },
];

const faqs = [
  {
    q: "C'est mieux que ChatGPT ?",
    a: "ChatGPT ne connaît ni la loi LCAP, ni la structure d'une annonce SeLoger, ni la base ADEME. Il vous faudrait 4 prompts et 10 min pour reproduire ce qu'Annoncia fait en 10 secondes — et il oubliera la mention DPE une fois sur trois. Nous avons codé la conformité dans le système.",
  },
  {
    q: "Mes données sont protégées ?",
    a: "Aucune donnée client n'est conservée par défaut. Les générations sont éphémères. Hébergement UE, conforme RGPD.",
  },
  {
    q: "Si j'achète et que ça ne me plaît pas ?",
    a: "Remboursement intégral sous 14 jours, sans justification. Vous n'êtes engagé à rien.",
  },
  {
    q: "Vous intégrez quels logiciels métier ?",
    a: "Import CSV générique (toutes plateformes), Apimo et Hektor en API sur l'offre Agence. Demandez votre intégration : on en livre une par mois.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          Pour agents immobiliers en France
        </p>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          L'annonce immobilière qui vend,
          <br />
          <span className="text-[var(--color-accent)]">en 10 secondes, en règle.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Conforme LCAP, mentions DPE/GES automatiques depuis l'ADEME,
          déclinée pour SeLoger, LeBonCoin, Instagram et brochures PDF.
          Vous gagnez 30 minutes par mandat.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/generate">
            <Button size="lg">Essayer gratuitement (3 annonces)</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="ghost">
              Voir les tarifs →
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
          Sans carte bancaire. Aucune installation.
        </p>
      </section>

      {/* Social proof / chiffres */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)] py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 text-center md:grid-cols-4">
          <Stat value="10 s" label="par annonce générée" />
          <Stat value="5" label="formats simultanés" />
          <Stat value="100 %" label="conformité légale" />
          <Stat value="30 min" label="économisées par mandat" />
        </div>
      </section>

      {/* Pain point */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-3xl font-bold">
          Aujourd'hui, rédiger une annonce immobilière, c'est :
        </h2>
        <ul className="mt-6 space-y-3 text-lg text-[var(--color-muted-foreground)]">
          <li>· 25 minutes de rédaction et relecture par bien</li>
          <li>· Aller chercher manuellement le DPE/GES dans le diagnostic</li>
          <li>· Réécrire 3 fois pour SeLoger, LeBonCoin et le post Instagram</li>
          <li>· Oublier les mentions copro ALUR — et risquer le signalement DGCCRF</li>
          <li>· Voir vos annonces noyées dans la masse parce qu'elles disent toutes la même chose</li>
        </ul>
        <p className="mt-8 text-2xl font-semibold">
          Annoncia fait les 5, à votre place, en une seule action.
        </p>
      </section>

      {/* Features */}
      <section className="bg-[var(--color-muted)] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold">Ce qu'aucun ChatGPT brut ne fera</h2>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Notre moteur intègre 18 mois de jurisprudence et la base DPE ADEME.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-5"
              >
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Un tarif honnête pour un outil rentable</h2>
        <p className="mt-3 text-[var(--color-muted-foreground)]">
          Annoncia se rembourse en 1 mandat par mois — vous économisez 8 à 12 heures.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <PricingCard
            name="Solo"
            price="29 €"
            note="HT / mois — agent indépendant"
            features={[
              "Annonces illimitées",
              "Tous les formats (SeLoger, LeBonCoin, Insta, FB, PDF)",
              "DPE auto ADEME",
              "Conformité légale garantie",
              "Historique 90 jours",
            ]}
            cta="Commencer"
          />
          <PricingCard
            name="Agence"
            price="79 €"
            note="HT / mois — équipes"
            features={[
              "Tout Solo, +",
              "Multi-utilisateurs (5 sièges)",
              "Import batch CSV / Apimo / Hektor",
              "API et webhooks",
              "Support prioritaire",
            ]}
            cta="Choisir Agence"
            highlight
          />
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
          Garantie remboursé 14 jours. Sans engagement, annulable en 1 clic.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-muted)] py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          La prochaine annonce, c'est en 10 secondes.
        </h2>
        <p className="mt-3 text-[var(--color-muted-foreground)]">
          3 essais gratuits, sans carte. Mettez-la sur un vrai mandat, voyez.
        </p>
        <div className="mt-8">
          <Link href="/generate">
            <Button size="lg">Générer ma première annonce →</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold">
          Annoncia
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/pricing">
            <Button variant="ghost" size="sm">Tarifs</Button>
          </Link>
          <Link href="/generate">
            <Button size="sm">Essayer</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-10">
      <div className="mx-auto max-w-6xl px-6 text-sm text-[var(--color-muted-foreground)]">
        <p>
          © {new Date().getFullYear()} Annoncia · Annonces immobilières IA conformes à la
          législation française.
        </p>
      </div>
    </footer>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  note,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 text-left ${
        highlight
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
          : "border-[var(--color-border)]"
      }`}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-3 text-4xl font-bold">{price}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{note}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href="/generate">
          <Button variant={highlight ? "primary" : "secondary"} className="w-full">
            {cta}
          </Button>
        </Link>
      </div>
    </div>
  );
}
