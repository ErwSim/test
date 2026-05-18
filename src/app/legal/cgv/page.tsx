import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
};

export default function CgvPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Conditions générales de vente</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Version du {new Date().toLocaleDateString("fr-FR")} · Vente B2B
      </p>

      <article className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Objet et champ d'application</h2>
          <p>
            Les présentes CGV régissent les abonnements souscrits sur le site annoncia.fr par des
            professionnels (B2B) au sens de l'article liminaire du Code de la consommation. Toute
            commande emporte acceptation pleine et entière des CGV.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Description des offres</h2>
          <p>
            Annoncia propose deux abonnements mensuels :
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              <strong>Solo</strong> — 29 € HT/mois&nbsp;: usage illimité pour un agent
              indépendant.
            </li>
            <li>
              <strong>Agence</strong> — 79 € HT/mois&nbsp;: 5 sièges, import batch CSV,
              connecteurs Apimo / Hektor, API REST et support prioritaire.
            </li>
          </ul>
          <p className="mt-2">
            Les offres incluent la TVA française au taux en vigueur (20 % pour les particuliers,
            auto-liquidée pour les professionnels établis dans l'UE hors de France et hors UE).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Commande et paiement</h2>
          <p>
            Le paiement s'effectue par carte bancaire via le prestataire Stripe. L'abonnement est
            mensuel, reconduit tacitement, et résiliable à tout moment depuis le portail client.
            La résiliation prend effet à la fin de la période en cours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Droit de rétractation</h2>
          <p>
            Le service étant destiné à un usage professionnel, le droit de rétractation prévu à
            l'article L.221-18 du Code de la consommation n'est pas applicable. Annoncia
            propose néanmoins une <strong>garantie de remboursement de 14 jours sans
            condition</strong>&nbsp;: tout client peut demander le remboursement intégral de son
            premier paiement dans les 14 jours suivant la souscription par simple email à
            facturation@annoncia.fr.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Tarification et révision</h2>
          <p>
            Les tarifs en vigueur sont ceux affichés sur la page Tarifs au moment de la
            souscription. Toute évolution tarifaire est notifiée 30 jours avant son application.
            L'utilisateur peut résilier avant l'entrée en vigueur du nouveau tarif.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Facturation</h2>
          <p>
            Une facture mensuelle est émise automatiquement par Stripe et accessible depuis le
            portail client.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Responsabilité</h2>
          <p>
            La responsabilité d'Annoncia est plafonnée au montant payé par le client sur les 12
            mois précédant le fait générateur. Annoncia ne saurait être tenue responsable des
            erreurs de saisie de l'utilisateur ni des conséquences d'une annonce publiée non
            relue.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Force majeure</h2>
          <p>
            Aucune des parties n'est responsable d'un manquement résultant d'un cas de force
            majeure au sens de l'article 1218 du Code civil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Loi applicable et juridiction</h2>
          <p>
            Les CGV sont régies par le droit français. Tout litige sera porté devant les
            tribunaux compétents du ressort du siège social d'Annoncia.
          </p>
        </section>
      </article>
    </main>
  );
}
