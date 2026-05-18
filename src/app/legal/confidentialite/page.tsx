import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
        ← Accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Version du {new Date().toLocaleDateString("fr-FR")} — Conforme RGPD (UE 2016/679).
      </p>

      <article className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Responsable de traitement</h2>
          <p>
            Annoncia ([forme juridique, RCS, adresse]). Délégué à la protection des données
            (DPO)&nbsp;: <a href="mailto:dpo@annoncia.fr" className="underline">dpo@annoncia.fr</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Données collectées</h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Compte</strong> : adresse email, mot de passe haché (bcrypt), nom de
              l'entreprise (facultatif).
            </li>
            <li>
              <strong>Paiement</strong> : géré exclusivement par Stripe ; Annoncia ne stocke
              jamais de numéro de carte. Identifiants Stripe (customer, subscription)
              conservés.
            </li>
            <li>
              <strong>Génération d'annonces</strong> : données du bien saisies (type, surface,
              prix, ville, DPE, atouts). Conservées 90 jours à des fins d'historique
              utilisateur, puis supprimées automatiquement.
            </li>
            <li>
              <strong>Logs techniques</strong> : adresse IP (hachée après 30 jours), user-agent,
              horodatage des requêtes API.
            </li>
            <li>
              <strong>Cookies</strong> : un cookie de session strictement nécessaire au
              fonctionnement du Service. Aucun cookie tiers de marketing sans consentement
              préalable.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Finalités &amp; bases légales</h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              Exécution du contrat (art. 6.1.b RGPD)&nbsp;: fournir le Service, facturer.
            </li>
            <li>
              Obligation légale (art. 6.1.c)&nbsp;: tenue de la comptabilité (10 ans —
              C. com. art. L.123-22).
            </li>
            <li>
              Intérêt légitime (art. 6.1.f)&nbsp;: sécurité applicative, prévention de la
              fraude, amélioration du Service.
            </li>
            <li>Consentement (art. 6.1.a)&nbsp;: cookies non strictement nécessaires.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Sous-traitants</h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Anthropic PBC</strong> (USA) — traitement IA des données du bien. Clauses
              contractuelles types UE-USA en vigueur. Aucune donnée d'identification de
              l'utilisateur final n'est transmise à Anthropic.
            </li>
            <li>
              <strong>Stripe Payments Europe Ltd</strong> (Irlande) — paiement et facturation.
            </li>
            <li>
              <strong>Vercel Inc.</strong> (USA) — hébergement de l'application. Données
              utilisateurs hébergées dans la région UE.
            </li>
            <li>
              <strong>ADEME / data.ademe.fr</strong> (France) — API publique pour la
              récupération des DPE par adresse. Aucune donnée personnelle transmise.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Durées de conservation</h2>
          <ul className="ml-6 list-disc space-y-1">
            <li>Compte actif&nbsp;: durée de l'abonnement + 3 ans (prospection).</li>
            <li>Historique des générations&nbsp;: 90 jours.</li>
            <li>Logs techniques&nbsp;: 12 mois (IP hachée après 30 jours).</li>
            <li>Factures&nbsp;: 10 ans (obligation comptable).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Vos droits</h2>
          <p>
            Vous disposez des droits d'accès, de rectification, d'effacement, de portabilité, de
            limitation et d'opposition (art. 15 à 22 RGPD). Pour les exercer&nbsp;:{" "}
            <a href="mailto:dpo@annoncia.fr" className="underline">dpo@annoncia.fr</a>.
            <br />
            Réponse sous 30 jours. Recours possible auprès de la CNIL (cnil.fr).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Sécurité</h2>
          <p>
            Chiffrement TLS 1.3 en transit, AES-256 au repos, hachage des mots de passe (bcrypt
            cost 12), accès aux données journalisé, principe du moindre privilège, MFA sur les
            comptes admin.
          </p>
        </section>
      </article>
    </main>
  );
}
