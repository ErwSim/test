# Audit architecture & scalabilité — Annoncia

> **Cible** : SaaS Next.js 15 / App Router · Objectif 10 000 abonnés payants en 18–24 mois (≈ 1 M€ ARR).
> **Date de l'audit** : 2026-05-18
> **Périmètre audité** : `src/` (App Router, lib, components), `next.config.ts`, `package.json`, `.env.example`, `README.md`.
>
> Conventions du rapport :
> - **État actuel** : ce qu'on lit dans le code aujourd'hui (sans extrapolation).
> - **Impact à 6 / 12 / 24 mois** : ce que ça casse si on ne fait rien.
> - **Reco** : choix précis (bibliothèque, pattern, version).

---

## 0. Synthèse exécutive

Le code MVP est **propre, lisible, idiomatique Next 15** (Server/Client clairement séparés, Zod en garde-fou, prompt caching Anthropic correctement câblé, headers de sécurité OK). En contrepartie, **tout ce qui fait un SaaS qui scale est absent** : pas de DB, pas d'auth, webhook Stripe à vide, rate-limit in-memory (donc cassé en multi-instance Vercel), pas d'observabilité, pas de tests, pas de CI. C'est cohérent avec un v0.1 mais devient une dette critique dès le 50ᵉ payant.

**Top 5 risques bloquants** (ordre d'urgence) :

1. **Webhook Stripe sans persistance** → les paiements sont aveugles : un abonnement annulé reste actif côté app. À corriger **avant la 1ʳᵉ vente réelle**.
2. **Rate-limit `Map<>` in-memory** → réinitialisé à chaque cold start Vercel, bypassable trivialement, faux quota gratuit. Switch Upstash Redis **avant la mise en prod publique**.
3. **Pas d'auth + pas de DB** → impossible de matérialiser le plan Solo/Agence, l'historique 90 jours promis dans `/pricing`, ou la multi-tenancy Agence. Bloquant pour facturer.
4. **Couplage direct Anthropic SDK dans `lib/anthropic.ts`** → migration provider (OpenAI, Gemini, ou simplement Claude Sonnet) = refactor transverse. Couche `LLMProvider` à introduire **avant le 1ᵉʳ test A/B de modèle**.
5. **Aucune observabilité** → on découvre les bugs par les emails clients. Sentry à brancher **avant le 1ᵉʳ utilisateur payant**.

---

## 1. Structure des dossiers

### État actuel

```
src/
├── app/                     # App Router
│   ├── api/
│   │   ├── dpe/route.ts             # proxy ADEME
│   │   ├── generate/route.ts        # endpoint LLM principal
│   │   └── stripe/webhook/route.ts  # webhook (stub)
│   ├── generate/
│   │   ├── page.tsx                 # SSR shell
│   │   └── GeneratorClient.tsx      # 474 LOC, formulaire monolithique
│   ├── pricing/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # 297 LOC, landing
├── components/ui/
│   ├── Button.tsx
│   └── Field.tsx                    # Input/Label/Select/Textarea
└── lib/
    ├── anthropic.ts                 # appel LLM
    ├── dpe.ts                       # client ADEME
    ├── prompts.ts                   # SYSTEM_PROMPT + builder
    ├── rate-limit.ts                # in-memory
    └── schemas.ts                   # Zod
```

**Sain pour un v0.1.** Le tri Server vs Client est rigoureux (`GeneratorClient.tsx` est isolé, `page.tsx` reste Server). Pas de mélange `pages/` ↔ `app/`. Path alias `@/*` propre.

### Ce qui manque

| Manque | Pourquoi c'est un problème |
|---|---|
| `src/server/` (ou `src/lib/server/`) avec frontière nette entre code Edge-safe vs Node-only | Aujourd'hui `lib/anthropic.ts` est importable par erreur dans un Client Component → leak de la clé API si quelqu'un fait l'erreur. |
| `src/db/` (schema + queries + client Drizzle) | Inexistant. |
| `src/features/<feature>/` (colocation page+actions+ui+tests) | À 10 features, `src/app` deviendra illisible si tout reste à plat. |
| `src/lib/auth/`, `src/lib/billing/`, `src/lib/ai/` (sous-domaines) | `lib/` plat fonctionne à 5 fichiers, devient un fourre-tout à 30. |
| `GeneratorClient.tsx` de 474 LOC | À découper en `FormProperty`, `FormDpe`, `FormCopro`, `FormFormats`, `Results`. Single-component géant = pas de réutilisation, pas de testable unitaire. |
| `src/app/page.tsx` de 297 LOC | Idem : à splitter en sections (`Hero`, `Features`, `Pricing`, `FAQ`). |
| `actions/` (Server Actions) | Aujourd'hui tout passe par `fetch('/api/...')`. Server Actions = moins de boilerplate, validation auto, revalidation tag native. |
| `middleware.ts` | Absent. Nécessaire pour rate-limit edge, auth gate, i18n future. |

### Impact

- **6 mois** : `GeneratorClient.tsx` devient ingérable (formulaire CSV Agence, branding agence, export PDF, etc.).
- **12 mois** : `lib/` plat → conflits Git, ownership flou.
- **24 mois** : refonte forcée si arrivée de 2-3 devs supplémentaires.

### Reco

Adopter une structure **feature-first** dès maintenant (coût quasi nul à 5 features) :

```
src/
├── app/                           # routing uniquement, fin pages
├── features/
│   ├── ai-generation/
│   │   ├── components/
│   │   ├── server/                # actions, llm provider call
│   │   ├── schemas.ts
│   │   └── prompts/
│   ├── billing/
│   │   ├── components/
│   │   ├── server/                # checkout, portal, webhook handlers
│   │   └── plans.ts
│   ├── dpe-lookup/
│   ├── auth/
│   └── teams/                     # multi-tenancy
├── lib/                           # transverses (date, money, error)
├── db/                            # drizzle schema + client + migrations
├── components/ui/                 # design system uniquement
└── middleware.ts
```

Découper `GeneratorClient.tsx` en sous-composants ≤ 150 LOC. Migrer les `POST /api/generate` vers **Server Actions** (`'use server'`) — sauf le webhook Stripe et l'API publique v1.0 (qui resteront des Route Handlers).

---

## 2. Séparation des couches (UI / business / data / IA)

### État actuel

| Couche | Localisation | Verdict |
|---|---|---|
| UI | `components/ui/*`, `app/*/page.tsx`, `GeneratorClient.tsx` | OK mais monolithique. |
| Business | Inexistante au sens "service" → la logique métier vit **dans la route handler** (`api/generate/route.ts`) et le **prompt** (`lib/prompts.ts`). | Mélange validation/quota/LLM/réponse HTTP dans un seul handler de 57 LOC. Tolérable maintenant, sera ingrat à tester. |
| Data access | **Aucune**. Pas de DB, pas de repo. | Bloquant. |
| IA | `lib/anthropic.ts` → SDK Anthropic directement. | Couplage fort. Pas d'interface, pas de fallback, pas de mock. |

Le couplage `route.ts → lib/anthropic.ts → SDK Anthropic` est direct. Il n'y a aucune abstraction de provider, aucun usecase pur, aucune injection.

### Impact

- **6 mois** : tester une régression de prompt = devoir mocker tout le SDK Anthropic → friction → on ne teste pas → bugs en prod.
- **12 mois** : impossible de switcher facilement vers Claude Sonnet 4.5 (qualité +) ou Haiku 4.7 (coût −) sans toucher au code prod.
- **24 mois** : ré-écriture forcée pour intégrer un router multi-modèles (cost-aware routing) ou un cache sémantique.

### Reco

Architecture en **3 couches** dès la prochaine itération :

```
Route Handler / Server Action      ← orchestration HTTP
        │
        ▼
Usecase pur (business)             ← src/features/<f>/server/usecase.ts
        │
        ├── PortIn  : repository, llmProvider, billingProvider
        └── retourne un résultat typé (Result<T, AppError>)
```

Pattern minimal :

```ts
// src/features/ai-generation/server/usecase.ts
export interface LLMProvider {
  generateListing(input: GenerateInput): Promise<GenerateResult>;
}

export async function generateListingUsecase(
  input: GenerateInput,
  deps: { llm: LLMProvider; repo: GenerationsRepo; quota: QuotaService; userId: string }
) { ... }
```

Implémentations dans `src/features/ai-generation/server/providers/anthropic.ts`, `openai.ts`, etc. Tests : on mock `LLMProvider` (5 lignes).

**Reco précise** : pas besoin d'une lib DI. Pattern fonctionnel `function(input, deps)`. Lib utile pour le typage des erreurs : **`neverthrow`** (`Result<T,E>`) ou simplement des classes `AppError` discriminées.

---

## 3. Persistance — DB & schéma initial

### État actuel

Aucune DB. Le rate-limiter est in-memory (`Map<string, Counter>`). Le webhook Stripe n'écrit rien (`TODO branchement DB`).

### Impact

- **6 mois** : impossible de promettre "Historique 90 jours" (déjà vendu sur `/pricing` 😬), impossible de facturer correctement, GDPR ingérable.
- **12 mois** : pas de cohorte d'usage = pas de pricing optimisé, pas de churn analysis.
- **24 mois** : avec 10 000 abonnés × ~30 générations/mois = 300k rows/mois → toute archi non préparée (mauvais index, pas de partitioning) se paie cher.

### Reco : **Postgres + Drizzle ORM**, hébergé sur **Neon** (puis migration Aurora si besoin)

**Pourquoi pas Supabase** (alors qu'il est mentionné dans le README) :
- Vendor-lock fort (RLS spécifique, gotrue auth, edge functions).
- Le bénéfice Supabase = "auth+db+storage en 1" devient marginal si on prend `better-auth` ou `Auth.js v5` à côté.
- Migration en sortie de Supabase = douloureuse (RLS policies à réécrire en RBAC applicatif).
- Coût compétitif Neon (autoscale to zero, branching par PR).

**Pourquoi pas PlanetScale / MySQL** :
- Plus de FK depuis 2024 (Vitess), JSONB Postgres irremplaçable pour le payload IA.

**Pourquoi Drizzle vs Prisma** :
- Drizzle = SQL-first, types ultra-précis, **0 ms cold start** (vs Prisma 200–800 ms — critique en serverless Vercel).
- Migrations Drizzle simples (`drizzle-kit generate`), pas de daemon.
- Si l'équipe préfère Prisma : OK aussi, mais activer `prisma-client-edge` + `accelerate`.

**Stack précise** :
- `drizzle-orm` + `drizzle-kit`
- `@neondatabase/serverless` (driver HTTP) pour les Route Handlers Vercel
- Pool `pg` pour les jobs longs (cron, queue worker)
- `drizzle-zod` pour générer les schémas Zod depuis les tables

### Schéma initial recommandé

```ts
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "solo", "agency"]);
export const subStatusEnum = pgEnum("sub_status", ["trialing", "active", "past_due", "canceled", "incomplete"]);
export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);

// === Identity ===
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerifiedAt: timestamp("email_verified_at"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // pour le quota IP→user link en cas de soft-login
  lastSeenAt: timestamp("last_seen_at"),
});

// === Multi-tenancy (Agence, 5 sièges) ===
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // billing rattaché à l'org, pas à l'user, pour le plan Agency
  stripeCustomerId: text("stripe_customer_id").unique(),
});

export const orgMembers = pgTable("org_members", {
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull().default("member"),
  invitedBy: uuid("invited_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: uniqueIndex("org_members_pk").on(t.orgId, t.userId),
  byUser: index("org_members_user_idx").on(t.userId),
}));

// === Billing ===
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  plan: planEnum("plan").notNull().default("free"),
  status: subStatusEnum("status").notNull().default("trialing"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  seats: integer("seats").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === Domain : générations IA ===
export const generations = pgTable("generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  // input figé pour audit légal (DPE, conformité LCAP)
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),  // {results:[...], legal_checks:{...}}
  // pour Stripe usage-based future ET pour analytics coût
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cacheReadTokens: integer("cache_read_tokens"),
  llmProvider: text("llm_provider").notNull().default("anthropic"),
  llmModel: text("llm_model"),
  costEurCents: integer("cost_eur_cents"),  // coût réel
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  byOrg: index("gen_org_created_idx").on(t.orgId, t.createdAt.desc()),
}));

// === Quota & rate-limit (au-delà du Redis : compteur mensuel persistant) ===
export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  // ex: "generation", "csv_batch", "api_call"
  kind: text("kind").notNull(),
  // période YYYY-MM pour les compteurs mensuels (index BTree + count(*))
  period: text("period").notNull(),
  cost: integer("cost").notNull().default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  byOrgPeriod: index("usage_org_period_idx").on(t.orgId, t.period, t.kind),
}));

// === API publique (v1.0) ===
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  name: text("name").notNull(),
  // on stocke seulement le hash (SHA-256) — jamais le secret en clair
  keyHash: text("key_hash").notNull().unique(),
  prefix: text("prefix").notNull(),  // 8 premiers caractères pour affichage
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  byOrg: index("api_keys_org_idx").on(t.orgId),
}));
```

**Points-clés** :
- `subscriptions` rattaché à `organizations`, pas à `users` → même un Solo a une "org perso" de 1 seat. Cela évite une refonte douloureuse au moment de lancer Agence.
- `generations.input/output` en JSONB → schéma flexible. Index GIN si on cherche un jour `WHERE input @> '{"city":"Bordeaux"}'`.
- `usage_logs` permet la facturation usage-based à terme (API publique, Stripe Metered Billing).
- `apiKeys.keyHash` (SHA-256) — voir §9.

### Migrations & data lifecycle

- `drizzle-kit` (npm script `db:generate`, `db:migrate`).
- Cron RGPD : DELETE générations > 90 j sur plans Free/Solo, > 365 j sur Agency (paramétrable). Implémenter via Vercel Cron + une Server Action sécurisée.

---

## 4. Auth — choix MVP rapide + production-ready

### État actuel

Aucune auth. `extractClientIp()` + quota IP = pseudo-protection.

### Critères pour Annoncia

1. Email + password (les agents immobiliers ne sont pas tous fans des magic links).
2. Magic link en option (UX moderne).
3. Login Google (optionnel mais boost conversion ~+15 %).
4. **Multi-tenancy native** : invitations org, rôles.
5. **Self-hosted friendly** : pas de SaaS qui peut nous couper.
6. **Server Components compatible** : récupérer la session sans hack.

### Comparatif

| Critère | better-auth | Auth.js v5 (NextAuth) | Clerk | Supabase Auth |
|---|---|---|---|---|
| Multi-tenancy / orgs / invitations natives | **Oui (plugin `organization`)** | Non, à coder | Oui (payant Pro+) | Non, à coder via RLS |
| Server Components Next 15 | Oui | Oui (v5) | Oui | Oui |
| Self-hosted, vendor-free | **Oui** | Oui | Non (SaaS only) | Non (SaaS only) |
| Coût à 10k MAU | ~0 € (DB only) | ~0 € | ~625 $/mo (au-delà de 10k MAU) | $25/mo Pro + auth gratuit jusqu'à 50k MAU |
| Stripe sync intégré | Plugin officiel | Manuel | Manuel | Manuel |
| Maturité écosystème (2026) | Stable, croissance forte | Très stable | Très stable | Très stable |
| RBAC custom | Oui | À coder | Limité (sauf B2B Add-on) | RLS Postgres |
| Maintenance | Active | Active | SaaS | SaaS |
| Migration sortante | Facile (DB nous appartient) | Facile | **Dur** (export pénible) | Moyen |

### Reco : **better-auth**

- Couvre invitations, orgs, rôles **out-of-the-box** (besoin direct du plan Agency).
- DB Postgres = on contrôle nos users, pas de risque de hausse de prix Clerk.
- Plugin officiel `stripe()` pour sync `subscriptions` automatique.
- Edge-compatible (Vercel middleware).
- Schéma users compatible 1-pour-1 avec celui défini ci-dessus (table `users`, `accounts`, `sessions`, `verifications`).

**Fallback acceptable** : Auth.js v5 si l'équipe préfère un projet plus ancien. À éviter : Clerk (vendor-lock + coût qui scale mal sur le marché FR à 29 €/mois), Supabase Auth (vendor-lock + on n'utilise pas le reste de Supabase).

### Impact

- **6 mois** : sans auth = pas de Solo facturable. Bloquant.
- **12 mois** : sans orgs natives, refonte douloureuse pour Agence.
- **24 mois** : sans contrôle de la table users, blocage GDPR + portabilité.

---

## 5. Stripe — flow & gating

### État actuel

- `src/app/api/stripe/webhook/route.ts` : signature vérifiée (`stripe.webhooks.constructEvent`) ✓
- **Aucun handler effectif** : `TODO branchement DB` dans 100 % des cas.
- Pas de route `/api/stripe/checkout`, pas de `/api/stripe/portal`.
- Boutons `/pricing` pointent vers `/generate` (placeholders).
- Pas de gating (tout est gratuit dans la limite des 3 IP).

### Problèmes structurels à anticiper

1. **Idempotence** : Stripe peut renvoyer le même event 2× (retry). Sans clé d'idempotence, on risque de doubler une subscription en DB.
2. **Ordering** : `customer.subscription.created` peut arriver après `checkout.session.completed`. Sans gestion d'ordre, on perd l'état.
3. **Race** : webhook + callback `success_url` arrivent en parallèle → l'utilisateur voit "non abonné" 2 s puis "abonné".
4. **TVA UE** : non configurée (à activer dans Stripe Tax).

### Reco — flow découpé

```
src/features/billing/server/
├── stripe-client.ts                     # singleton Stripe
├── checkout.ts                          # createCheckoutSession()
├── portal.ts                            # createPortalSession()
├── webhook/
│   ├── handler.ts                       # router (event.type → handler)
│   ├── handlers/
│   │   ├── checkout-completed.ts
│   │   ├── subscription-upserted.ts
│   │   └── subscription-deleted.ts
│   └── events.ts                        # log persistant des events traités
├── plans.ts                             # config plans (limits, prices, features)
└── gating.ts                            # canUse(orgId, feature) → boolean
```

**Patterns à appliquer** :

1. **Table `stripe_events`** pour idempotence :
   ```ts
   pgTable("stripe_events", {
     id: text("id").primaryKey(),  // event.id Stripe
     type: text("type").notNull(),
     processedAt: timestamp("processed_at").defaultNow(),
   });
   ```
   Premier acte du handler : `INSERT ... ON CONFLICT DO NOTHING RETURNING id` → si rien remonté, on a déjà traité, on renvoie 200.

2. **Upsert subscription** systématiquement depuis l'objet Stripe (source de vérité = Stripe), pas de delta :
   ```ts
   db.insert(subscriptions).values({ ... }).onConflictDoUpdate({ target: subscriptions.orgId, set: { ... } });
   ```

3. **Trial gating** : `subscriptions.status = 'trialing'` + `trialEndsAt`. Stripe gère automatiquement la transition via `trial_period_days` à la création du Checkout. À la fin du trial, Stripe émet `customer.subscription.updated` avec `status=active`.

4. **Feature gating centralisé** :
   ```ts
   // src/features/billing/plans.ts
   export const PLAN_LIMITS = {
     free:   { genPerMonth: 3,   seats: 1, csvBatch: false, apiAccess: false },
     solo:   { genPerMonth: Infinity, seats: 1, csvBatch: false, apiAccess: false },
     agency: { genPerMonth: Infinity, seats: 5, csvBatch: true, apiAccess: true },
   } as const;

   export function can(plan: Plan, feature: keyof Limits) { ... }
   ```
   À utiliser dans chaque Server Action en début : `if (!can(sub.plan, 'csvBatch')) throw new UpgradeRequiredError();`.

5. **Webhook idempotency + retries** : Vercel Function timeout 60 s, donc la queue des handlers lourds (générer un PDF, envoyer un email de bienvenue) doit basculer en **Inngest** (cf §8).

### Impact

- **6 mois** : si on lance avec le webhook actuel = paiements aveugles, churn invisible, RGPD violé (utilisateur résilié = données toujours actives).
- **12 mois** : pas de gating clean = leak de valeur (Solo a accès au CSV batch par bug = perte de revenu Agency).
- **24 mois** : sans logs d'events idempotent, debug d'un rebill foiré = enfer.

---

## 6. Observabilité

### État actuel

- `console.error("[generate] error:", message)` × 1 seul endroit.
- Pas de Sentry, pas de Datadog, pas d'OpenTelemetry, pas de structured logging.
- Pas d'analytics produit (`/pricing` mentionne Plausible en TODO, rien d'installé).

### Reco — 3 piliers à brancher dès maintenant

1. **Error tracking** : **Sentry** (`@sentry/nextjs`).
   - Source maps auto, support Server Actions Next 15, intégration Vercel.
   - `Highlight.io` est OK mais l'écosystème Sentry est imbattable (issue tracking, Slack alerts, release tracking).
   - `Axiom` = excellent pour **logs**, pas pour les erreurs.

2. **Structured logging** : **`pino`** (côté Node Route Handler / Server Action) + transport Axiom ou Better Stack.
   - Format JSON, niveau, requestId via `headers().get('x-request-id')`.
   - **Pas** de `console.log` au-delà du dev. Bannir via ESLint rule `no-console: ["error", { allow: ["warn", "error"] }]`.

3. **Analytics produit** : **PostHog** (auto-host ou cloud).
   - Funnel : landing → form → submit → result → upgrade click.
   - Replays sessions (anonymisés).
   - Feature flags (test A/B prompt v1 vs v2 sans déployer).
   - Alternative plus light : Plausible (analytics seul, pas de funnel/event).

### Cible (pile concrète)

| Besoin | Outil |
|---|---|
| Erreurs front + back | **Sentry** |
| Logs structurés serveur | **pino** → **Axiom** (ou Better Stack) |
| Analytics produit, A/B, funnel | **PostHog** cloud EU |
| Métriques business (MRR, churn) | **Stripe Sigma** + dashboard custom Drizzle |
| Uptime monitoring externe | **BetterStack Uptime** |
| Traces / latence LLM | **Helicone** ou **Langfuse** (proxy Anthropic) |

**Helicone vs Langfuse** : pour Annoncia, Langfuse self-hosté est mieux (open-source, on garde les prompts), Helicone est plus simple à brancher (juste un base URL). Choix : **Langfuse cloud EU** pour démarrer, self-host si volume > 1M$ tokens/mois.

### Impact

- **6 mois** : 1ʳᵉ erreur cliente = découverte par email, support cher.
- **12 mois** : impossible de prouver SLA (Agency 4h ouvrées promis sur `/pricing`).
- **24 mois** : sans Langfuse, on ne sait pas pourquoi un prompt v2 a augmenté le churn.

---

## 7. Multi-tenancy (offre Agence — 5 sièges)

### État actuel

Aucune notion d'org. Tout est anonyme + IP.

### Reco — modèle à 3 entités

`users` (1-N) ↔ `org_members` (N-N rôle) ↔ `organizations` (1) → `subscriptions`, `generations`, `api_keys`.

Schéma déjà défini en §3. Points-clés :

1. **Une seule "personal org" par user à la création** (slug = nanoid). Le user qui passe Agency n'a rien à migrer.
2. **Switcher d'org** côté UI (cookie `active_org_id` validé serveur à chaque request).
3. **Server context** : helper `requireActiveOrg()` qui charge `{ org, role, plan }` une fois par request — utilisé dans toutes les Server Actions.
4. **Invitations** : table `org_invitations(email, orgId, role, token, expiresAt)` + email transactionnel (Resend).
5. **Limite seats** : `plans.ts` → `seats: 5` pour Agency. Server Action `inviteMember` vérifie `count(org_members) < plan.seats`.

### RLS Postgres si on choisit Supabase ?

Si **Supabase** (déconseillé en §3) : **oui**, RLS obligatoire. Sinon vulnérabilité IDOR triviale.

Si **Neon + Drizzle** (reco) : **non, RLS pas indispensable**. Application-level access control via helper `requireActiveOrg(orgId)` qui vérifie `WHERE org_id = $activeOrgId` dans chaque query est suffisant **à condition** que :

- Aucune route handler ne fasse de query brute sans passer par les repositories.
- Les repositories prennent **toujours** `orgId` en 1ᵉʳ argument typé.
- Un ESLint custom rule (ou un `tsc` linter) bloque les queries qui ne contiennent pas `org_id` dans le `WHERE`.

**Reco** : application-level. Plus simple à debugger, plus rapide, pas de vendor-lock RLS. RLS = nice-to-have défense en profondeur (à activer en phase 3 si on chassent SOC 2).

### Impact

- **6 mois** : sans `org_members`, le 1ᵉʳ client Agency = re-déploiement urgent.
- **12 mois** : si on a oublié `orgId` dans 2-3 queries → leak de données entre agences (incident critique GDPR).
- **24 mois** : sans modèle d'orgs propre, le déploiement white-label (un jour ?) est impossible.

---

## 8. Background jobs (batch CSV Agence, etc.)

### État actuel

Tout est synchrone. Server Actions Vercel = **60 s max** sur le plan Pro (10 s sur Hobby).

### Cas d'usage à anticiper

| Job | Durée typique | Doit être async ? |
|---|---|---|
| Génération 1 annonce | 5–15 s | Non (sync) |
| Batch CSV 100 lignes | 5–15 min | **Oui** |
| Export PDF brochure | 2–10 s | Non (sync) |
| Crawl Apimo/Hektor (cron 1h) | quelques min | **Oui** |
| Cleanup générations RGPD (>90 j) | quelques sec | **Oui** (cron) |
| Email digest mensuel | quelques min | **Oui** |
| Sync ADEME en batch (préchauffage cache) | heures | **Oui** |

### Limites concrètes des Server Actions

- Timeout 60 s (Pro) / 900 s (Enterprise) — insuffisant pour CSV gros.
- Bloque le request → l'utilisateur attend une réponse HTTP → besoin de SSE/polling.
- Pas de retry natif.
- Pas de fan-out (1 CSV → 100 générations en parallèle).

### Reco : **Inngest**

| Outil | Pour Annoncia |
|---|---|
| **Inngest** | **Reco**. Excellente DX Next 15, déclaration de jobs en TS dans le repo, retries, fan-out (`step.parallel`), step memoization, cron natif. Free tier généreux. Cloud EU disponible. |
| Trigger.dev v3 | Très bon concurrent. Plus orienté workflows visuels. UI très propre. Plus jeune. |
| BullMQ + Redis | Très bien si on host nos workers. **Trop d'ops** pour un fondateur solo. |
| Vercel Cron | OK pour les **crons simples** (cleanup, digest). Pas pour les workflows. |
| QStash (Upstash) | Sympa pour les jobs simples (1 step). Pas assez riche pour CSV batch. |

**Pattern batch CSV** avec Inngest :

```ts
export const csvBatchJob = inngest.createFunction(
  { id: "csv-batch", retries: 3, concurrency: { limit: 5, key: "event.data.orgId" } },
  { event: "csv.batch.requested" },
  async ({ event, step }) => {
    const rows = await step.run("parse-csv", () => parseCsv(event.data.fileUrl));
    await step.run("check-quota", () => assertCanGenerate(event.data.orgId, rows.length));
    // Fan-out : 1 step par ligne, parallélisé
    await Promise.all(
      rows.map((row) => step.invoke("generate-one", { function: generateOneJob, data: { ...row, orgId: event.data.orgId } }))
    );
    await step.run("send-completion-email", () => sendEmail(...));
  }
);
```

### Impact

- **6 mois** : sans queue, le 1ᵉʳ CSV de 200 lignes timeout → support → refund.
- **12 mois** : intégration Apimo/Hektor (sync 1h) impossible sans cron + queue.
- **24 mois** : besoin de webhooks sortants (notifier le client à la fin du batch) → forcément event-driven.

---

## 9. API publique (roadmap v1.0)

### État actuel

Aucune. Mentionnée dans `/pricing` (plan Agence) et roadmap README.

### Reco — design REST + tokens longue durée

**Routing** :
- `src/app/api/v1/<resource>/route.ts` (versioné dès le départ : v1, v2 cassants).
- Préfixe `Authorization: Bearer ann_<32 chars>`.

**Authentification API keys** :

1. Génération : `crypto.randomBytes(24).toString("base64url")` → `ann_xxx`.
2. Stockage : **SHA-256(key) en DB** (`apiKeys.keyHash`), affichage du prefix (`ann_a1b2c3..`) en UI pour identification visuelle.
3. Validation middleware :
   ```ts
   const hash = createHash("sha256").update(token).digest("hex");
   const row = await db.query.apiKeys.findFirst({ where: eq(apiKeys.keyHash, hash) });
   if (!row || row.revokedAt) → 401;
   ```
4. Mise à jour `lastUsedAt` async (queue Inngest pour ne pas bloquer).

**Rate-limit par tier** (Upstash Ratelimit avec sliding window) :

| Plan | Limite |
|---|---|
| Solo (pas d'API) | 0 |
| Agency | 60 req/min · 5 000 req/jour |
| Agency Plus (futur) | 600 req/min |

Headers de réponse :
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (si 429)

**Versioning** :
- URL path (`/api/v1/`).
- Changelog public dans `/docs/api/changelog`.
- Politique : minimum 12 mois de support de la version N-1.

**Documentation** :
- **OpenAPI 3.1** auto-généré depuis les schémas Zod (`@asteasolutions/zod-to-openapi`).
- UI : **Scalar** ou **Mintlify**. Scalar est plus moderne en 2026, gratuit, intégrable en `/api/docs`.

**SDK clients** :
- Pas avant 1 000 clients. Si besoin : `openapi-typescript` → typescript SDK auto-généré.

### Impact

- **6 mois** : pas critique tant que pas d'utilisateur Agence.
- **12 mois** : 1ᵉʳ client Agency veut intégrer son CRM → blocker commercial.
- **24 mois** : sans rate-limit propre, 1 client peut bouffer notre budget Anthropic.

---

## 10. Tests

### État actuel

Aucun. Pas de `vitest.config`, pas de `playwright.config`, pas de fichier `*.test.*`.

### Stratégie recommandée — pyramide 70/20/10

| Niveau | Outil | Coverage | Quoi tester |
|---|---|---|---|
| **Unit (70 %)** | **Vitest** | 80 % sur `src/features/*/server/`, `src/lib/`, schemas | Usecases purs (mocks providers), Zod schemas, prompts builders, gating |
| **Integration (20 %)** | **Vitest** + Drizzle test DB (Postgres dans Docker via Testcontainers) | Critique sur webhook Stripe, queries org-scoped | Webhook idempotency, repos, quota counter |
| **E2E (10 %)** | **Playwright** | Smoke tests + parcours critiques | Signup → checkout → generate → portal cancel ; invitation Agency ; quota free dépassé |

**Coverage cible** :
- Global : **> 70 %** (mesure `c8`/`v8`).
- `src/features/billing/` : **> 90 %** (zone de saignement financier).
- `src/features/ai-generation/server/usecase.ts` : **> 85 %**.
- UI : pas de coverage cible — Playwright suffit.

**Cas critiques à couvrir absolument** :

1. Webhook Stripe — idempotency (2× même event → 1× insert).
2. Webhook Stripe — handler par event type.
3. `requireActiveOrg(userId, orgId)` — refus si user n'est pas membre.
4. Quota gratuit — 4ᵉ request renvoie 429.
5. Quota Solo — illimité dans l'usage normal.
6. Prompt builder — DPE F/G → flag `f_or_g_warning`.
7. Zod schemas — code postal invalide → erreur.
8. Parse JSON Claude — markdown fences enlevés.

**Pas de Jest** : Vitest natif TS, plus rapide, compatible Vite/Next testing.

**Tests AI** (LLM eval) : pas dans la pyramide CI. À faire avec **Langfuse evals** ou **Promptfoo** dans un workflow séparé (`pnpm eval`), lancé manuellement avant changement de modèle ou de prompt.

### Impact

- **6 mois** : sans tests, chaque refacto = peur → on n'ose plus refactorer → dette accumulée.
- **12 mois** : régression sur la conformité légale = amende DGCCRF + perte de confiance.
- **24 mois** : impossible d'onboarder un dev sans 3 semaines de bug hunting.

---

## 11. CI/CD

### État actuel

Pas de `.github/workflows`. Déploiement présumé par push direct.

### Reco

**Plateforme** : GitHub Actions + Vercel (intégration native).

**`.github/workflows/ci.yml`** :

```yaml
on: [pull_request, push]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-pnpm@10
      - pnpm install --frozen-lockfile
      - pnpm typecheck
      - pnpm lint
      - pnpm test            # vitest, avec couverture
      - pnpm test:e2e        # playwright headless (skip si pas de PREVIEW_URL)
      - pnpm build           # next build
```

**Preview Vercel** : automatique sur chaque PR (déjà natif Vercel + GitHub).

**Migrations DB** :
- `pnpm db:generate` produit les fichiers SQL versionnés dans `drizzle/`.
- En CI : `pnpm db:check` (Drizzle vérifie cohérence schema ↔ migrations).
- En prod : workflow séparé `deploy.yml` qui lance `pnpm db:migrate` **avant** le déploiement Vercel.
- Avec **Neon branching** : chaque PR a sa propre branche DB (preview Vercel + DB isolée) → tests sur vraie DB sans pollution.

**Secrets** : GitHub Actions Secrets + Vercel Env Vars. Pas de `.env` commité (déjà OK : `.env.example` seulement).

**Garde-fous PR** :
- Branch protection main : require typecheck + tests + 1 review.
- Pas de force-push sur main.
- Pas de merge sans squash (historique lisible).

**Release** : tag `v0.x.y` → changelog auto via `changesets`.

### Impact

- **6 mois** : sans CI = build prod cassé → un PR mal mergé = 0 € de revenu pendant 2h.
- **12 mois** : sans Neon branching = tester une migration = stress.
- **24 mois** : sans changelog discipliné = impossible de communiquer aux clients API les breaking changes.

---

## 12. Découplage IA — se prémunir d'un changement de provider

### État actuel

`lib/anthropic.ts` importe `@anthropic-ai/sdk` directement. La route `api/generate` appelle `generateAnnonces(input)` dans le handler. Toutes les particularités Anthropic (`cache_control: { type: "ephemeral" }`, structure `response.content[0].text`, `usage.cache_read_input_tokens`) **fuient** dans la couche métier.

Cas qui se présentera :
- Claude Haiku 4.7 sort en 2026 H2 → migration souhaitée.
- Anthropic augmente ses prix → A/B avec OpenAI GPT-5 Nano ou Gemini 2.5 Flash.
- Bénéfice qualité avec Sonnet pour le plan Agency premium.

### Reco — Port + Adapter pattern

```ts
// src/features/ai-generation/server/llm/port.ts
export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  generate(args: {
    systemPrompt: string;
    userPrompt: string;
    maxOutputTokens: number;
    enablePromptCache?: boolean;
  }): Promise<{
    text: string;
    usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number };
    costEurCents: number;
  }>;
}
```

```ts
// src/features/ai-generation/server/llm/anthropic-provider.ts
export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  constructor(public readonly model: string) {}
  async generate(args) {
    // particularité ephemeral cache, JSON extraction, etc. restent ici
  }
}

// src/features/ai-generation/server/llm/openai-provider.ts (à venir)
export class OpenAIProvider implements LLMProvider { ... }
```

```ts
// src/features/ai-generation/server/llm/index.ts
export function getLLM(): LLMProvider {
  switch (process.env.LLM_PROVIDER) {
    case "openai":    return new OpenAIProvider(process.env.OPENAI_MODEL!);
    case "anthropic":
    default:          return new AnthropicProvider(process.env.ANTHROPIC_MODEL!);
  }
}
```

### Compléments

1. **Pricing dans le code** : table `LLM_PRICING = { "claude-haiku-4-5": { in: 0.001, out: 0.005, cached: 0.0001 } }` (€ par 1k tokens) → `generations.costEurCents` calculé déterministiquement.
2. **JSON Output** : utiliser `tool_use` Anthropic (structured outputs) plutôt que d'extraire JSON d'un texte. Idem `response_format: { type: 'json_schema' }` côté OpenAI. À refactorer **avant** d'ajouter un 2ᵉ provider.
3. **Évaluation cross-provider** : Langfuse + Promptfoo permettent de jouer le même set de fixtures sur 2 providers et de comparer (latence, coût, conformité légale check).
4. **Failover** : à 1 000 clients, configurer un fallback provider (`OPENAI_FALLBACK_ENABLED=true`) → si Anthropic 5xx > 3× en 1 min, on bascule. Pas avant.
5. **Cache sémantique** : à 10k clients, considérer un cache `pgvector` sur `(propertyType, city, surface_bucket, dpe, ...)` → 30 % de hit rate possible sur le marché FR (annonces standardisées).
6. **Provider routing par plan** : `Agency` → Sonnet (qualité), `Solo` → Haiku (coût). Géré au niveau usecase via `getLLMFor(plan)`.

### Impact

- **6 mois** : pas critique tant qu'on reste sur Haiku. Mais coût du refacto = 1 jour si on le fait maintenant, 2 semaines à 24 mois.
- **12 mois** : 1ᵉʳ A/B impossible sans cette couche.
- **24 mois** : sans abstraction, dépendance critique à un fournisseur unique = risque commercial (prix, SLA, géopolitique IA).

---

## Plan d'évolution architectural en 3 phases

### Phase 1 — MVP / Launch (0 → 100 clients) · 0–6 mois

**Objectif** : facturer le 1ᵉʳ Solo, valider le PMF.

**À livrer absolument** :
1. DB Postgres Neon + Drizzle (schéma §3, sans `apiKeys`).
2. better-auth (email/password + magic link + Google) + table `users`/`org_members` (mono-seat).
3. Stripe Checkout + Portal + Webhook complet (handlers idempotents, table `stripe_events`).
4. Quota & gating via `subscriptions.plan` + `usage_logs`.
5. Upstash Redis pour rate-limit IP (remplace `lib/rate-limit.ts`).
6. Sentry + pino → Axiom.
7. Refacto `GeneratorClient` en sous-composants ≤ 150 LOC.
8. Couche `LLMProvider` (un seul adapter Anthropic, mais l'interface existe).
9. Tests Vitest sur usecase generation + webhook Stripe (target 60 % coverage sur `src/features/*/server/`).
10. CI GitHub Actions (typecheck, lint, test, build).
11. Pages légales (CGU/CGV/Mentions/Politique conf RGPD).
12. Cron Vercel : cleanup générations > 90 j.

**Stack précise phase 1** :
- Next.js 15 · React 19 · TypeScript strict
- Drizzle ORM + Neon (serverless driver)
- better-auth + organization plugin
- Stripe SDK v17, Stripe Tax activé
- Upstash Redis (rate-limit, idempotency keys)
- Anthropic SDK + `@/features/ai-generation/server/llm/AnthropicProvider`
- Sentry, pino, PostHog cloud EU
- Vercel Pro (60 s timeout, Cron)
- Vitest + Testing Library
- Tailwind v4

**KPI sortie de phase** : 100 clients payants, MRR ≥ 3 000 €, webhook 0 erreur sur 30 j, p95 latence `/api/generate` < 8 s.

---

### Phase 2 — Scale (100 → 1 000 clients) · 6–12 mois

**Objectif** : ouvrir l'offre Agency, supporter le batch CSV, professionnaliser l'ops.

**À livrer** :
1. Multi-tenancy complet : invitations org, rôles, switcher UI.
2. **Inngest** branché : jobs CSV batch, cleanup RGPD, email digest, sync futurs connecteurs.
3. **Playwright E2E** : 5 parcours critiques (signup → checkout → cancel ; invitation org ; quota free ; CSV batch happy path ; lookup DPE ADEME).
4. **Langfuse** cloud EU : trace tous les appels LLM, eval set avec 50 fixtures de conformité légale.
5. **2ᵉ provider LLM** branché derrière `LLMProvider` (OpenAI ou Gemini) — utilisé en A/B sur 5 % du trafic via PostHog feature flag.
6. Connecteurs Apimo / Hektor (sync hourly via Inngest cron).
7. Coverage tests > 70 % global, > 90 % billing.
8. Neon DB branching par PR (preview Vercel + DB éphémère).
9. **Helm de release** : semver, changelog auto via `changesets`.
10. **SOC 2 prep** (sans certif encore) : journal audit DB, MFA admin, backups vérifiés mensuellement.
11. Page status publique (BetterStack).
12. **CSP strict** + secret rotation Anthropic/Stripe.

**Nouvelles briques stack** :
- Inngest cloud EU
- Langfuse cloud EU
- Playwright + Neon branching
- Resend pour transactional emails (invitations, billing receipts)
- `changesets` pour release

**KPI sortie de phase** : 1 000 clients (700 Solo + 300 Agency), MRR ≥ 35 k€, latence p95 < 6 s, churn mensuel < 5 %, 0 incident GDPR.

---

### Phase 3 — Mature (1 000 → 10 000 clients) · 12–24 mois

**Objectif** : tenir 10 k abonnés, ouvrir l'API publique, prep SOC 2.

**À livrer** :
1. **API publique v1.0** : OpenAPI 3.1 auto-généré, doc Scalar, SDK TypeScript, rate-limits par tier (Upstash Ratelimit).
2. **Cache sémantique pgvector** : embeddings sur les champs `propertyType/surface_bucket/city/dpe/tone`. Hit rate cible 25 %.
3. **Provider routing par plan** : Agency premium → Sonnet, Solo → Haiku. Failover automatique si Anthropic 5xx.
4. **DB sharding / read replicas** : Neon autoscale + read replica pour analytics (`generations` table > 50M rows attendus).
5. **Partitioning Postgres** `generations` par mois (table partitionnée par `created_at`) pour drop des partitions > 90j en O(1).
6. **RLS Postgres activé** (défense en profondeur) + audit log table dédiée.
7. **SOC 2 Type 1** (Vanta ou Drata) : préparation + audit.
8. **i18n** (EN + DE pour expansion EU) : `next-intl`.
9. **Connecteurs CRM** : push annonces vers SeLoger Pro API, LeBonCoin Pro API (quand dispo).
10. **Webhooks sortants** pour les intégrateurs API (annonce générée, batch terminé).
11. **Self-serve teams Plus** (plus de 5 sièges, custom pricing) via Stripe quote.

**Nouvelles briques stack** :
- pgvector (extension Postgres Neon)
- next-intl
- Vanta ou Drata (SOC 2 audit)
- BullMQ ou Inngest "Branch" pour throughput > 1k jobs/min
- CDN custom pour les PDF (Cloudflare R2)

**KPI sortie de phase** : 10 000 clients, MRR ≥ 350 k€, ARR ≈ 4,2 M€ (au-delà de l'objectif initial), latence p95 < 4 s, NPS > 50, SOC 2 Type 1 obtenu.

---

## Annexe — Récap des choix précis (cheat-sheet)

| Domaine | Choix |
|---|---|
| ORM | **Drizzle ORM** + Drizzle Kit |
| DB managed | **Neon Postgres** (Aurora si besoin > 24 mois) |
| Auth | **better-auth** (plugin `organization` + `stripe`) |
| Billing | Stripe + Stripe Tax + table `stripe_events` (idempotency) |
| Cache / rate-limit | **Upstash Redis** + `@upstash/ratelimit` |
| Jobs / queue | **Inngest** cloud EU |
| Email transactionnel | **Resend** |
| Error tracking | **Sentry** (`@sentry/nextjs`) |
| Logs structurés | **pino** → **Axiom** |
| Analytics produit | **PostHog** cloud EU |
| LLM observability | **Langfuse** cloud EU |
| Tests unit | **Vitest** + Testing Library |
| Tests E2E | **Playwright** |
| LLM abstraction | Port/Adapter custom (`LLMProvider`) |
| Provider IA primaire | Anthropic Claude Haiku 4.5 (puis Sonnet sur Agency Premium) |
| API docs | **Scalar** + OpenAPI 3.1 généré depuis Zod |
| CI | **GitHub Actions** + Vercel preview |
| Hosting | **Vercel Pro** (Enterprise au-delà de 5 k clients) |
| State management front | Pas de Redux. `useState` + Server Actions. Si besoin futur : Zustand. |
| Form | `react-hook-form` + `zod` (à introduire phase 2 si formulaire CSV) |

---

*Rapport généré sans aucune modification du code source. Aucun fichier autre que `audits/architecture.md` n'a été touché.*
