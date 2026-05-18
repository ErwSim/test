import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: true, follow: true },
};

export default function MentionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose-fr">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Mentions légales</h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Éditeur du site</h2>
        <p>
          <strong>Annoncia</strong>
          <br />
          Forme juridique : [SAS / EURL — à compléter]
          <br />
          Capital social : [à compléter]
          <br />
          RCS : [Ville + numéro — à compléter]
          <br />
          Siège social : [adresse — à compléter]
          <br />
          N° TVA intracommunautaire : [à compléter]
          <br />
          Directeur de la publication : [Nom du fondateur]
          <br />
          Contact : contact@annoncia.fr
        </p>

        <h2 className="text-xl font-semibold">Hébergement</h2>
        <p>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
          <br />
          Données de paiement hébergées par Stripe Payments Europe Ltd (Irlande).
          <br />
          Données utilisateurs hébergées dans l'UE (région eu-west).
        </p>

        <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
        <p>
          L'ensemble du site (textes, design, code, marque « Annoncia ») est protégé par le Code
          de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.
        </p>

        <h2 className="text-xl font-semibold">Conditions d'utilisation</h2>
        <p>
          L'utilisation du service est soumise aux{" "}
          <Link href="/legal/cgu" className="underline">
            Conditions générales d'utilisation
          </Link>{" "}
          et aux{" "}
          <Link href="/legal/cgv" className="underline">
            Conditions générales de vente
          </Link>
          .
        </p>

        <h2 className="text-xl font-semibold">Médiateur de la consommation</h2>
        <p>
          Conformément à l'article L.612-1 du Code de la consommation, le client peut recourir
          gratuitement à un médiateur de la consommation. Médiateur référencé : [à désigner avant
          la mise en service commerciale].
        </p>
      </section>
    </main>
  );
}
