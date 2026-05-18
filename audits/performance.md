# Audit de performance — Annoncia (Next.js 15 App Router)

Date : 2026-05-18
Build de référence : `pnpm build` exécuté à la racine (`/home/user/test`).

## Synthèse du build actuel

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      170 B         105 kB
├ ○ /_not-found                            994 B         102 kB
├ ƒ /api/dpe                               131 B         102 kB
├ ƒ /api/generate                          131 B         102 kB
├ ƒ /api/stripe/webhook                    131 B         102 kB
├ ○ /generate                             4.5 kB         109 kB
├ ○ /legal/cgu                             170 B         105 kB
├ ○ /legal/mentions-legales                170 B         105 kB
└ ○ /pricing                               170 B         105 kB
+ First Load JS shared by all             101 kB
  ├ chunks/146-1bafdb6c616a2346.js       45.3 kB   (gzippé approx, ~173 KB raw)
  ├ chunks/6fe292aa-e0ec2ab9f0ce6bb7.js  54.2 kB   (gzippé approx, ~173 KB raw)
  └ other shared chunks (total)           1.9 kB
```

Les 9 routes (et non 7 — `/legal/cgu` et `/legal/mentions-legales` se sont ajoutées) sont prerenderées sauf les API routes (`ƒ`). Le shared bundle est sain (101 kB pour Next 15 + React 19), aucune feuille payante n'est tirée dans le client.

Verdict global : la base est saine pour un MVP, **aucune dépendance lourde ne fuit côté client**. Les axes d'optimisation sont surtout perceptuels (streaming Claude, fonts, edge) et de robustesse (cache ADEME, DB future).

---

## 1. Bundle size

### État actuel
- Shared : **101 kB First Load JS** (chunks `146` ~45 kB et `6fe29...` ~54 kB gzippés). Ratio attendu pour Next 15 + React 19 sans dep custom.
- `/generate` ajoute **4.5 kB** spécifiques (`page-97ffd2596779b8fe.js` = 15.5 kB raw, soit ~4-5 kB gzippé) : c'est `GeneratorClient` + ses sous-composants `Field` / `Button`.
- Page d'accueil, `/pricing`, `/legal/*` : **170 B** spécifiques (entièrement Server Components).
- Vérification grep sur les chunks `.next/static/chunks/**.js` : **0 occurrence** de `Anthropic`, `@anthropic`, `Stripe`, `stripe.com`. Les SDK serveurs sont correctement isolés.
- Tailles brutes des SDK (côté `node_modules`) : `@anthropic-ai/sdk` ≈ **7.9 MB**, `stripe` ≈ **7.0 MB**. S'ils fuitaient, le shared exploserait — ce n'est pas le cas.

### Impact
**Faible**. Rien à corriger pour le moment, juste à protéger.

### Recommandations
- Ajouter une garde anti-régression : importer Stripe / Anthropic uniquement depuis des fichiers `/src/lib/*` ou `route.ts` (server-only). Tagger ces fichiers avec `import "server-only";` en tête (paquet déjà inclus dans Next) pour faire échouer le build si jamais ils sont importés depuis un Client Component.
  - Fichiers concernés : `/home/user/test/src/lib/anthropic.ts`, futur `/src/lib/stripe.ts` quand le wrapper sera factorisé.
- Activer (futur) `experimental.optimizePackageImports: ["lucide-react", "date-fns", ...]` quand vous ajouterez des libs d'icônes ou d'utilitaires : tree-shaking amélioré.
- Mettre en place `@next/bundle-analyzer` au minimum derrière une env `ANALYZE=true` pour pouvoir surveiller le drift.

---

## 2. Server vs Client Components

### État actuel
- `GeneratorClient` (`/home/user/test/src/app/generate/GeneratorClient.tsx`, 475 lignes, `"use client"`) tient l'intégralité du formulaire **et** l'affichage des résultats **et** la logique de copie / onglets / DPE lookup.
- Les sous-composants `Button` et `Field` sont déjà universels (pas de `"use client"`), donc ils peuvent vivre dans un Server Component sans surcoût.
- Beaucoup de balisage dans `GeneratorClient` est **purement statique** : les labels, les listes `propertyType`, les listes A-G, les sections "Bien", "Copropriété", "Honoraires", "Atouts" sont du JSX sans interaction. Les composants interactifs sont :
  - les `<input>` / `<select>` du formulaire (gérés par `FormData`, pas de `onChange` contrôlé sauf le tab des formats),
  - le bouton "Auto via ADEME",
  - le bouton submit + l'état `loading / error / results`,
  - les pastilles formats (sélection visuelle),
  - le bouton "Copier".

### Impact
**Moyen**. Tout le bloc résultats (badges légaux, onglets, rendu de la `<pre>`, bouton "Copier") peut être déplacé sans effet de bord. Le formulaire lui-même est piégé tant qu'il reste un seul composant client, mais on peut **fortement** réduire la surface interactive.

### Recommandations
- Découper `GeneratorClient` en 3 :
  1. **`<GeneratorForm />` (client)** : juste les inputs + bouton submit, utilise un Server Action ou conserve le `fetch('/api/generate')`. `'use client'`.
  2. **`<DpeLookupButton />` (client, isolé)** : autonome, gère son propre `useState`. Permettrait à terme d'extraire le `tryDpeLookup` et de retirer les `document.getElementById` (cf. point 7 : DOM impératif).
  3. **`<ResultsPanel results={...} />`** : peut rester client à cause du clipboard / des tabs, mais devient un petit composant focalisé. Le `<Badge>` et la mise en page de chaque résultat peuvent être des Server Components rendus en `<ResultsPanel>` par le parent client après réception fetch — pas trivial sans RSC streaming, donc à arbitrer.
- Faire passer le bouton "Copier" en custom element ou en composant client minuscule (`<CopyButton text={...} />`) chargé en `next/dynamic({ ssr: false })` : économise quelques centaines de bytes de hydration pour les utilisateurs qui n'ouvrent jamais les résultats.
- **Bonus architecture** : remplacer `fetch('/api/generate')` + `useState` par un **Server Action** + `useFormState`/`useActionState`. Bénéfices : code plus court, validation Zod réutilisée, gestion d'erreurs unifiée, pas besoin d'exposer `/api/generate` publiquement (le webhook Stripe doit rester en route handler par contre).
- Remplacer les `document.getElementById(...)` (lignes 62-71 et 219-222 de `GeneratorClient.tsx`) par un état contrôlé ou par `useRef` : c'est un anti-pattern React qui casse aussi la cohérence Server/Client.

---

## 3. Streaming / Suspense

### État actuel
- Aucune utilisation de `<Suspense>` dans `/src` (grep négatif).
- Aucun fichier `loading.tsx` dans l'app router (rien sous `/src/app/**/loading.tsx`).
- La page `/generate` se rend en Server Component (page.tsx) mais `GeneratorClient` est rendu de bloc, sans frontière Suspense.
- `generateAnnonces` (`/home/user/test/src/lib/anthropic.ts`) utilise `messages.create` **non-stream** (`response.content.find(...)`). Latence affichée 3–10 s subie en plein écran derrière un spinner.

### Impact
**Haut** — c'est **le** point qui peut transformer la perception du produit. 3-10 s sans feedback, c'est un usage où ~25 % des utilisateurs abandonnent.

### Recommandations
- Ajouter `/src/app/generate/loading.tsx` (un squelette du formulaire) : rendu instantané pendant la navigation depuis `/`.
- Ajouter une frontière `<Suspense fallback={<ResultsSkeleton />}>` autour du panneau résultats, même si le streaming Claude n'est pas encore branché — cela formalise la frontière.
- **Streamer Claude** (cf. point 8) en utilisant `client().messages.stream(...)` ou directement l'AI SDK Vercel (`ai` package, qui sait gérer les SSE Anthropic et le `useChat`). Architecturer ainsi :
  - `/api/generate` retourne un `text/event-stream` qui pousse les `content_block_delta` Claude.
  - Côté client, consommer avec `fetch` + `ReadableStream` (ou `useChat` de `ai/react`) et écrire progressivement dans la `<pre>`.
- Si vous gardez du JSON structuré (5 formats), envisager le streaming d'un **JSON par format** (server itère sur les formats et envoie 5 events), ou le streaming d'un seul format à la fois (l'UI montre "SeLoger ✓, LeBonCoin en cours…").

---

## 4. Caching

### État actuel
- ADEME : `/home/user/test/src/lib/dpe.ts` ligne 49 utilise `next: { revalidate: 86400 }` (24 h). **Bonne pratique** côté Data Cache Next.js.
- Cependant, la route `/api/dpe` (`/home/user/test/src/app/api/dpe/route.ts`) **n'a pas de directive `revalidate`** ni `dynamic = "force-static"`. Comme c'est une route handler avec params dynamiques (`url.searchParams`), Next la traite par défaut en `dynamic = "force-dynamic"` au runtime. Le cache de `fetch()` ADEME en interne fonctionne, mais la réponse HTTP du route handler **elle-même** n'est pas cachée côté CDN/Next : chaque requête client refait l'aller-retour Next → mémoire process → ADEME-cache. Sur Vercel, c'est OK ; sur un cold-start, c'est un appel ADEME réel.
- `/api/generate` : `dynamic = "force-dynamic"` (correct, dépend du body).
- `/api/stripe/webhook` : `dynamic = "force-dynamic"` (obligatoire).
- Aucune route ne déclare `revalidate` au niveau page.

### Impact
**Moyen**. L'ADEME tient ~24h en cache process, mais en pratique deux IPs ne se partagent pas l'instance Vercel ; la cohérence du cache est instable.

### Recommandations
- Ajouter une réponse `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` sur `/api/dpe` (cf. NextResponse headers) : permet au CDN Vercel de servir des réponses ADEME identiques pour des paramètres identiques pendant 24 h, et tolérer 7 jours en stale.
  - Construire une clé déterministe (address normalisée + postalCode) et inclure `Vary: ...` si besoin.
- Ajouter un mécanisme de **dédup process-level** : un `Map<string, Promise<DpeRecord[]>>` autour de `searchDpeByAddress` pour éviter qu'un agent qui clique 3 fois sur "Auto via ADEME" ne déclenche 3 appels concurrents.
- Long terme : déplacer ce cache vers Upstash Redis (déjà mentionné dans README pour le rate-limit) — 1 seule infra à gérer.
- Pour `/api/generate`, **ne pas cacher** la réponse, mais ajouter `Cache-Control: private, no-store` explicite pour éviter qu'un proxy d'agence ne cache une génération d'un user pour un autre.

---

## 5. Images

### État actuel
- Aucune balise `<Image>` (`next/image`) dans `/src` (grep négatif).
- Aucun asset image dans `/public/` (dossier vide).
- La landing `/` est entièrement texte + couleurs Tailwind : pas de hero image, pas de captures produit, pas de logos clients.

### Impact
**Faible (aujourd'hui), moyen demain**. Tant qu'il n'y a pas d'image, pas de problème ; mais une landing B2B sans aucun visuel converti mal. Dès que vous ajouterez :
- un screenshot du générateur,
- un logo Annoncia,
- des logos "ils nous font confiance",

il faudra que ce soit `next/image` ou rien.

### Recommandations
- Quand vous ajouterez des images, **toujours** utiliser `next/image` avec `width/height` explicites (pour ne pas causer de CLS, cf. point 7) et `priority` sur le hero éventuel pour booster le LCP.
- Pour le futur logo, préférer **SVG inline** (zéro requête, parfaitement scalable) plutôt qu'un PNG.
- Configurer `images.remotePatterns` dans `next.config.ts` si vous tirez des images depuis un CDN externe (S3, Bunny, etc.).
- Pas besoin pour l'instant de toucher au fichier.

---

## 6. Fonts

### État actuel
- `/home/user/test/src/app/layout.tsx` : aucun `import { Inter } from "next/font/google"` ou équivalent.
- `/home/user/test/src/app/globals.css` ligne 15 : `--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, ...` — c'est la **system font stack**. Excellent choix par défaut.

### Impact
**Faible**. Vous utilisez les fonts système : pas de FOIT/FOUT, pas de CLS lié à la font, pas de requête réseau additionnelle. Pour un SaaS B2B fonctionnel, c'est tout à fait acceptable.

### Recommandations
- **Si vous voulez un look custom** (Inter, Geist, etc.), passer obligatoirement par `next/font` :
  ```ts
  import { Inter } from "next/font/google";
  const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
  ```
  puis appliquer `inter.variable` sur `<html>` et garder le `--font-sans` dans Tailwind. Cela : (a) self-host le WOFF2, (b) inline le CSS critique, (c) élimine le CLS via `size-adjust`.
- **Si vous restez en system font** (recommandé pour la vitesse) : rien à changer, mais ajouter `font-display: swap;` ne s'applique pas ici (pas de @font-face). Pensez juste à vérifier que la stack rend bien identiquement sur macOS / Windows / Android.

---

## 7. Web Vitals (landing `/`)

### État actuel
- **LCP** : déterminé par le `<h1>` du hero (texte uniquement, pas d'image). Avec 101 kB de shared JS sur réseau 4G médian (~6 Mbps effectif), le LCP devrait tomber entre 1.2 s et 2.0 s. **Bon** par défaut.
- **CLS** : risque sur le `<header sticky>` avec `backdrop-blur` et la pastille colorée `<span className="bg-success">` dans le hero. Pas de polices custom donc pas de FOUT.
- **INP** : la landing est presque sans JS interactif (juste les `<details>` natifs de la FAQ et les `<Link>`). L'INP devrait être excellent.
- **TTFB** : pages statiques (`○` dans le build) → servies depuis CDN, TTFB optimal.

### Impact
**Faible** sur la landing actuelle. **Moyen** dès qu'il y aura un hero image / une vidéo.

### Recommandations
- Vérifier le CLS avec un test Lighthouse réel — le `Footer` qui calcule `new Date().getFullYear()` est statique (rendu au build), donc OK.
- Sur `/generate`, le LCP risque d'être le formulaire complet : 4.5 kB de JS + hydratation. Acceptable mais peut être amélioré en server-ifiant les sections statiques (cf. point 2).
- Ajouter un `<link rel="preconnect">` vers le domaine ADEME (`data.ademe.fr`) dans `layout.tsx` quand le bouton "Auto via ADEME" est visible — gain ~80 ms sur le DNS+TLS du premier clic.
- Mettre en place un suivi automatisé : `useReportWebVitals` (Next 15) ou Vercel Speed Insights. Sans mesure, pas d'optimisation.

---

## 8. API Claude latency

### État actuel
- `generateAnnonces` retourne une réponse **complète** : il attend la fin du `messages.create` (3-10 s d'après l'énoncé) avant de répondre `200 OK`.
- Côté UX, `setLoading(true)` puis spinner texte "Génération en cours…". Aucune indication de progression.
- Le cache `cache_control: { type: "ephemeral" }` sur le system prompt est activé (`/home/user/test/src/lib/anthropic.ts` ligne 49) : excellente optim coût + ~30 % de latence d'input gagnée à partir du 2e appel.

### Impact
**Haut**. La perception 3-10 s est un tueur de conversion sur la première génération (la seule qui compte pour acquérir l'utilisateur). Streamer transforme "3 s d'attente" en "premier mot apparaît à 600 ms".

### Recommandations
- **Streamer la réponse Claude** :
  ```ts
  const stream = client().messages.stream({ ... });
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      controller.enqueue(encoder.encode(chunk.delta.text));
    }
  }
  ```
  exposé via un `ReadableStream` dans `/api/generate` (route handler peut retourner `new Response(stream, { headers: { "Content-Type": "text/event-stream" } })`).
- Adapter le client à `EventSource` ou `fetch()` + `response.body.getReader()`.
- Problème : la réponse Claude est attendue en **JSON structuré** pour la conformité légale (`legal_checks`, `results[]`). Deux options :
  1. **Streamer du texte, puis JSON.parse à la fin** : on affiche le delta en live, on parse à la fermeture. Compromis simple, garde la conformité Zod.
  2. **Streamer item par item** : reformuler le prompt pour que Claude émette des objets ligne-par-ligne (`{"format":"seloger","title":...}\n{"format":"leboncoin",...}`). Plus complexe mais plus naturel pour l'UI.
- En complément, déclencher la mutation **dès le `onSubmit`** sans attendre la validation côté client → tout en effectuant la validation Zod côté serveur (déjà le cas) → gain de quelques ms.
- Activer `prompt_caching` plus largement : déjà le cas pour le `SYSTEM_PROMPT`, vérifier que le hit cache fonctionne (loguer `response.usage.cache_read_input_tokens`).

---

## 9. Edge runtime

### État actuel
- Toutes les 3 routes API déclarent `export const runtime = "nodejs"` :
  - `/api/generate` (`/home/user/test/src/app/api/generate/route.ts` ligne 6) — utilise `@anthropic-ai/sdk`.
  - `/api/dpe` (`/home/user/test/src/app/api/dpe/route.ts` ligne 4) — utilise `fetch` natif.
  - `/api/stripe/webhook` (`/home/user/test/src/app/api/stripe/webhook/route.ts` ligne 4) — utilise `stripe` (Node-only).

### Impact
**Moyen** pour `/api/dpe`. **Faible-Moyen** pour `/api/generate` (l'edge serait techniquement supportable, mais le streaming Anthropic en edge a parfois des soucis de cold start sur certaines régions). **Aucun** pour Stripe webhook (Node obligatoire — la lib utilise `Buffer`, `crypto.timingSafeEqual`, etc.).

### Recommandations
- **`/api/dpe` → Edge** : route candidate idéale. Ne fait qu'un `fetch` externe + transformation JSON. Le passage en `runtime = "edge"` divise la latence de cold start par ~5 (de ~500 ms à ~80 ms) et permet une exécution géographiquement plus proche de l'utilisateur.
  - À vérifier : `next.config.ts` headers globaux fonctionnent en edge — oui pour les `headers()` config.
- **`/api/generate` → Edge possible** mais à ne tenter qu'**après** avoir branché le streaming (point 8) : c'est là que l'Edge brille (TTFB minimal). Tester avec `runtime = "edge"` ; si l'Anthropic SDK utilise des APIs Node (vérifier les imports), basculer sur `fetch` natif vers l'API Anthropic.
- **`/api/stripe/webhook` → reste en Node**. Le SDK Stripe a besoin de `Buffer` pour `constructEvent`. Ne pas y toucher.
- Côté pages : `/`, `/pricing`, `/legal/*` sont déjà statiques (`○`) — pas besoin d'edge, le CDN suffit.

---

## 10. Database queries (planification)

### État actuel
- Aucune DB connectée. Le rate-limiter (`/home/user/test/src/lib/rate-limit.ts`) utilise une `Map` en mémoire process — explicitement documenté comme "MVP, à remplacer".
- Le webhook Stripe (`/home/user/test/src/app/api/stripe/webhook/route.ts`) a deux `TODO branchement DB` lignes 35 et 41.
- L'historique 90 jours mentionné dans `/pricing` n'a pas encore de support.

### Impact (à venir)
**Haut**. Toute DB mal architecturée explose en latence : c'est la cause #1 de dégradation des Web Vitals sur les SaaS B2B.

### Recommandations préventives
- **Stack proposé** :
  - **Postgres** managé (Neon, Supabase, Vercel Postgres). Neon a un mode serverless qui survit bien aux cold starts d'Edge.
  - **Prisma** ou **Drizzle** comme ORM. Drizzle est plus léger (~20 kB) et n'a pas de runtime côté Edge — privilégié si vous comptez passer des routes en edge.
  - **Pool de connexions** : utiliser un **pooler** (Neon pooler, Supavisor, PgBouncer) pour éviter d'épuiser les connexions Postgres depuis les serverless functions.
- **Pattern recommandés** :
  - Ne **jamais** faire de query DB depuis un Server Component non cacheé sans `unstable_cache` ou `revalidateTag` — sinon chaque navigation paie la latence.
  - Pour le rate-limit : passer sur **Upstash Redis** (gratuit jusqu'à 10k commandes/jour) avec `@upstash/ratelimit`. Edge-compatible, beaucoup plus rapide que Postgres pour ce use-case.
  - Pour le webhook Stripe : écrire dans un `subscriptions` (user_id, plan, status, current_period_end). Indexer sur `user_id` + `stripe_customer_id`.
  - Pour l'historique 90 jours : table `generations` partitionnée par mois si volume > 1M lignes, sinon index simple `(user_id, created_at desc)`. Penser à un job de purge nocturne `DELETE WHERE created_at < now() - interval '90 days'`.
- **Observabilité** : activer dès J1 `pg_stat_statements` (ou équivalent), brancher OpenTelemetry sur Prisma/Drizzle pour avoir le p95 par query.
- **Anti-patterns à interdire** :
  - N+1 queries dans les listes de générations.
  - `prisma.$transaction` sur des opérations qui n'en ont pas besoin.
  - Connexions ouvertes pour des cron jobs sans pooler.

---

## Top 5 des optimisations à plus fort ROI

Classement par **(impact perçu × facilité d'implémentation) / coût de dev**.

| # | Optimisation | Impact | Effort | Pourquoi maintenant |
|---|---|---|---|---|
| **1** | **Streamer la réponse Claude** sur `/api/generate` (SSE ou `ReadableStream`) + UI qui écrit en live dans la `<pre>` | **Très haut** — passe la perception de 3-10 s à ~600 ms first-token | Moyen (1-2 j) | C'est le point qui transforme l'app d'un "outil qui marche" en un "outil qui paraît rapide". Le ROI conversion est massif sur la première génération gratuite. |
| **2** | **Découper `GeneratorClient`** en `<GeneratorForm />` + `<DpeLookupButton />` + `<ResultsPanel />`, retirer les `document.getElementById` au passage | Moyen — code plus maintenable, INP meilleur, possibilité de Server Action | Moyen (1 j) | Avant que ce fichier de 475 lignes ne devienne 1000 lignes. Plus on attend, plus c'est coûteux. |
| **3** | **Passer `/api/dpe` en `runtime = "edge"` + ajouter `Cache-Control: s-maxage=86400, stale-while-revalidate=604800`** sur la réponse HTTP | Moyen-Haut — divise par 5 la latence du bouton "Auto via ADEME" | Très faible (1 h) | Une seule ligne à changer + un header. Aucun risque, gain immédiat et mesurable. |
| **4** | **Ajouter `import "server-only"` dans `/src/lib/anthropic.ts` et un futur `/src/lib/stripe.ts`** + mettre en place `@next/bundle-analyzer` derrière `ANALYZE=true` | Moyen (préventif) — empêche une régression catastrophique si un dev importe Stripe depuis un Client Component | Très faible (30 min) | Coût quasi nul, sauvegarde un éventuel jour de débogage plus tard. |
| **5** | **Ajouter `/src/app/generate/loading.tsx`** (squelette du formulaire) **+ instrumenter Web Vitals** via `useReportWebVitals` ou Vercel Speed Insights | Moyen — meilleure perception navigation + données pour décider les optims suivantes | Faible (2 h) | Sans mesure, les optimisations ultérieures sont aveugles. Le `loading.tsx` est offert par App Router. |

### Hors top 5 mais à garder en tête
- Quand vous ajouterez une DB : **Drizzle + Neon pooler + Upstash pour le rate-limit** (cf. point 10).
- Quand vous ajouterez des images : **toujours** `next/image` avec `width/height` + `priority` sur le hero.
- Quand vous ajouterez une font custom : **toujours** `next/font` (jamais de `<link href="fonts.googleapis.com">`).
- Long terme : préconnexion `data.ademe.fr` dans le `<head>` de `/generate`.
