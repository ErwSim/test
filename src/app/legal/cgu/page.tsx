import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
};

export default function CguPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Conditions générales d'utilisation</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Version du {new Date().toLocaleDateString("fr-FR")}.
      </p>

      <article className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Objet</h2>
          <p>
            Annoncia (« le Service ») est une application en ligne permettant aux professionnels
            de l'immobilier de générer, à l'aide d'une intelligence artificielle, des annonces
            immobilières destinées à la diffusion sur des plateformes tierces.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Acceptation</h2>
          <p>
            L'accès au Service implique l'acceptation sans réserve des présentes CGU et de la{" "}
            <Link href="/legal/confidentialite" className="underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Responsabilité de l'utilisateur</h2>
          <p>
            L'utilisateur reste seul responsable du contenu des annonces qu'il diffuse. Il
            s'engage notamment à :
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>vérifier la véracité des données saisies (surface, DPE, prix, copropriété)&nbsp;;</li>
            <li>
              respecter la loi LCAP (loi n° 2014-366), la loi ALUR, la loi Hoguet et toutes les
              dispositions du Code de la construction et de l'habitation&nbsp;;
            </li>
            <li>
              ne pas utiliser le Service pour générer des contenus discriminatoires, mensongers ou
              trompeurs&nbsp;;
            </li>
            <li>relire systématiquement l'annonce produite avant publication.</li>
          </ul>
          <p className="mt-3">
            Annoncia met en œuvre des contrôles automatiques de conformité (mentions DPE, GES,
            copropriété, honoraires), mais sa garantie ne saurait se substituer à la
            responsabilité professionnelle de l'utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Disponibilité</h2>
          <p>
            Le Service est fourni en l'état, sans garantie de disponibilité 24/7. Une fenêtre de
            maintenance peut survenir sans préavis. L'objectif de disponibilité est de 99 %
            mensuelle. En cas d'indisponibilité majeure, l'utilisateur abonné est informé par
            email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Propriété intellectuelle</h2>
          <p>
            Les annonces générées appartiennent à l'utilisateur, qui dispose d'une licence
            d'usage illimitée. La marque, le code, les prompts système et l'interface restent la
            propriété exclusive d'Annoncia.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est décrit dans la{" "}
            <Link href="/legal/confidentialite" className="underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Modification</h2>
          <p>
            Annoncia se réserve le droit de modifier les CGU à tout moment. Les utilisateurs
            sont prévenus par email 30 jours avant l'entrée en vigueur des modifications
            substantielles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Loi applicable</h2>
          <p>
            Les présentes sont régies par le droit français. Tout litige relève des tribunaux
            compétents du ressort du siège social d'Annoncia, sauf dispositions impératives
            contraires.
          </p>
        </section>
      </article>
    </main>
  );
}
