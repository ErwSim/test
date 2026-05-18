# Annoncia — Annonces immobilières IA conformes à la législation française

> Générateur d'annonces immobilières en SaaS, vertical FR, codé pour viser **1 M€ d'ARR** sur 18–30 mois.

## Pourquoi ce projet ?

Choisi après l'étude comparée de 5 modèles d'affaires (micro-SaaS, extension Chrome, boilerplate, agence IA, SEO/affiliation). Score le plus élevé du panel sur l'équation **faisabilité solo × time-to-revenue × marché validé** :

- **TAM FR** : ~300 000 agents immobiliers + 30 000 agences. À 29 €/mois moyen pondéré → marché de **~108 M€/an**.
- **Concurrence validée mais immature** : SIANA, Keyzia, Twimmo facturent 30–35 €/mois, peu défendables ; le concurrent réel est **ChatGPT brut**, gratuit mais non conforme légalement.
- **Différenciateurs codés en dur** (impossibles à reproduire en quelques prompts ChatGPT) :
  1. Conformité LCAP / ALUR / Hoguet automatique (mentions DPE/GES, lots de copropriété, honoraires)
  2. **Récupération DPE auto via l'API publique ADEME** (gratuite, fiable)
  3. Multi-format en 1 appel : SeLoger / LeBonCoin / Instagram / Facebook / brochure PDF
  4. SEO local injecté (ville + quartier dans le titre et l'attaque)
  5. Pas d'invention : ce qui n'est pas fourni n'est pas inventé (devoir d'information loyale)

## Chemin vers 1 M€ d'ARR

| Plan | Prix HT | Cibles | Pour 1 M€ |
|---|---|---|---|
| Solo | 29 €/mois | Agent indépendant | 2 000 abonnés (0,67 % du TAM) |
| Agence | 79 €/mois | Agence 5 sièges | 500 abonnés (1,5 % du TAM) |

Atteignable en **18–24 mois** avec un mix outbound LinkedIn vers directeurs d'agence + SEO longue traîne (« générer annonce immobilière IA », « rédaction annonce LCAP ») + partenariats logiciels métier (Apimo, Hektor, Netty).

## Stack (best practices 2026)

- **Next.js 15** App Router · React 19 · TypeScript strict
- **Tailwind v4** (`@theme` natif CSS, plus de fichier `tailwind.config.js`)
- **Anthropic Claude Haiku 4.5** avec **prompt caching ephemeral** sur le system prompt → ~90 % de réduction du coût input à partir du 2e appel
- **Stripe** (Customer Portal pour annulation 1-clic — exigence légale UE)
- **Zod** pour la validation côté serveur de TOUTES les entrées utilisateur
- **API ADEME** (data.ademe.fr) pour DPE/GES — gratuite, publique, sans clé
- Sécurité : CSP-friendly headers, `poweredByHeader: false`, validation systématique côté serveur, rate-limit IP (à muscler en prod)

## Démarrer en local

```bash
pnpm install
cp .env.example .env.local
# Renseigner ANTHROPIC_API_KEY
pnpm dev
```

Ouvrir <http://localhost:3000>.

Le quota gratuit est de 3 générations par IP (configurable via `FREE_QUOTA_PER_IP`).

## Passer en prod — checklist

| À faire avant de pousser | Pourquoi |
|---|---|
| Brancher **Supabase** (auth email/magic link + table `users`, `subscriptions`, `generations`) avec **Row-Level Security** activé | Sécurité + persistance |
| Remplacer le rate limit en mémoire par **Upstash Redis** | Survie au cold start + multi-instance |
| Compléter le webhook Stripe (`src/app/api/stripe/webhook/route.ts`) pour persister les changements d'abonnement | Sinon les paiements sont aveugles |
| Créer les produits Stripe : Solo 29 €/mois HT, Agence 79 €/mois HT, configurer la **TVA UE** (Stripe Tax) | Conformité fiscale |
| Activer **Vercel Analytics** + **Plausible** pour mesurer le funnel landing → essai → conversion | Optimisation continue |
| Mettre en place un cron de nettoyage des générations > 90 jours (RGPD : minimisation) | RGPD |
| Page **CGU/CGV/mentions légales/politique de confidentialité** | Obligation légale FR |

## Plan d'acquisition — quick wins (en parallèle du code)

1. **LinkedIn outbound personnel** vers 50 directeurs d'agence/jour avec une démo vidéo de 30 s. Taux de réponse attendu 7–15 % en 2026 (Expandi).
2. **SEO longue traîne** : 30 articles « comment rédiger une annonce \[type de bien\] à \[ville\] » → générés via le produit lui-même, dogfooding.
3. **Partenariat avec 1 logiciel transactionnel** : leur offrir un mois gratuit pour leurs clients en échange d'une mention dans leur newsletter (Apimo, Hektor, Netty, Adapt Immo).
4. **Groupes Facebook agents immobiliers FR** : présence quotidienne, pas de spam, démos en réponse à des questions.
5. **Bouche-à-oreille** : programme parrainage 1 mois offert (parrain + filleul).

## Économie unitaire

- Coût Claude Haiku 4.5 par génération multi-format : ~0,01–0,03 €
- Hébergement Vercel free puis Pro à 20 $/mois
- Stripe : 1,4 % + 0,25 € (UE)
- **Marge brute estimée : 92–95 %** sur Solo, ~96 % sur Agence

À 2 000 abonnés Solo + 500 Agence : **1,00 M€ d'ARR**, **~940 k€ de marge brute**.

## Roadmap après le MVP

- v0.2 : Auth Supabase + Stripe complet + historique persistant
- v0.3 : Import CSV (Agence)
- v0.4 : Connecteur Apimo / Hektor
- v0.5 : Export PDF brochure avec branding agence
- v1.0 : API publique pour intégrateurs

## Licence

Propriétaire — tous droits réservés.
