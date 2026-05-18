# Audit qualité — Annoncia (Next.js 15 / React 19 / TypeScript)

Date : 2026-05-18
Périmètre : `src/` (App Router, Server/Client Components, API routes, lib, composants UI)
Stack détectée : Next.js 15.5, React 19.2, TypeScript 5.9 (strict), Zod 3.25, Tailwind 4.3, Anthropic SDK 0.96, Stripe 17.7.

Légende sévérités : **Bloquant** (à corriger avant prod) · **Important** (à planifier) · **Mineur** (nice-to-have) · **OK** (rien à faire).

---

## 1. App Router best practices

### Etat actuel

- L'arborescence respecte le pattern App Router : `src/app/{layout,page}.tsx`, segments `generate/`, `pricing/`, `api/*/route.ts`. Bon.
- `layout.tsx` et toutes les `page.tsx` sont des Server Components par défaut (aucun `"use client"` parasite). Bon.
- `src/app/generate/page.tsx` reste Server et délègue à un Client Component encapsulé `GeneratorClient.tsx`. Pattern Server/Client séparés respecté.
- `metadata` et `viewport` sont exportés correctement depuis `layout.tsx` (séparés conformément à Next 15).
- Les routes API utilisent `export const runtime = "nodejs"` et `export const dynamic = "force-dynamic"` quand pertinent. Bon.
- `next.config.ts` : `reactStrictMode: true`, `poweredByHeader: false`, headers de sécurité, `serverActions.bodySizeLimit`. Bon.

### Problèmes

- `next.config.ts` déclare `experimental.serverActions` alors qu'**aucune Server Action n'est utilisée** dans le projet. Le formulaire `GeneratorClient` part par `fetch("/api/generate")`. Soit on utilise réellement les Server Actions (recommandé, cf. §2), soit on retire l'option.
- `GeneratorClient.tsx` utilise massivement `document.getElementById(...)` (lignes 62-71, 219-221) pour piloter un formulaire React. C'est un anti-pattern App Router/React 19 : sortir du modèle déclaratif rend SSR/hydratation fragile et bloque toute future migration en Server Action.
- Pas de `loading.tsx` ni de `error.tsx` dans `app/generate/`. Toute la gestion du loading/erreur est portée par le state du composant client (bien fait, mais on perd les boundaries natives Next).
- Pas de `not-found.tsx` global.
- Le webhook Stripe n'a pas `export const dynamic` et c'est OK (POST → toujours dynamique), mais il manque `export const preferredRegion` / `runtime: "nodejs"` cohérence : `runtime = "nodejs"` est bien là, OK.

### Sévérité

**Important** (anti-pattern `document.getElementById` ; manque error/loading boundaries) + **Mineur** (option `experimental.serverActions` non utilisée).

### Recommandation

Remplacer la manipulation DOM par un state React contrôlé. Exemple minimal :

```tsx
// GeneratorClient.tsx
const [dpeData, setDpeData] = useState<{
  dpe?: string; ges?: string; min?: number; max?: number;
}>({});

// après fetch DPE :
setDpeData({
  dpe: record.classe_dpe ?? undefined,
  ges: record.classe_ges ?? undefined,
  min: record.cout_total_5_usages_min ?? undefined,
  max: record.cout_total_5_usages_max ?? undefined,
});

// dans le JSX :
<Select id="dpe" name="dpe" value={dpeData.dpe ?? ""} onChange={e => setDpeData(d => ({...d, dpe: e.target.value}))}>
  ...
</Select>
```

Ajouter `src/app/generate/loading.tsx` et `src/app/error.tsx` :

```tsx
// src/app/error.tsx
"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-6">
      <h2>Une erreur est survenue</h2>
      <button onClick={reset}>Réessayer</button>
    </main>
  );
}
```

---

## 2. React 19 — nouveautés et Server Actions

### Etat actuel

- `forwardRef` utilisé dans `Button.tsx` et `Field.tsx`. **Obsolète sous React 19** : `ref` est une prop standard sur les function components.
- Aucun usage de `useActionState`, `useFormStatus`, `useOptimistic`, `useTransition`. Pourtant le formulaire principal de `GeneratorClient` est exactement le cas d'usage canonique.
- `onSubmit` repose sur un `useState(loading)` géré manuellement + fetch JSON + `safeParse` côté serveur → tout cela serait remplaçable par une Server Action avec `useActionState`.
- `void navigator.clipboard.writeText(...)` (l.426) côté client : OK fonctionnellement, mais aucun retour utilisateur (pas de toast/feedback "Copié !").

### Sévérité

**Important** — `forwardRef` déprécié sous React 19, et on passe à côté de l'ergonomie native Server Actions / `useFormStatus`.

### Recommandation

**A. Supprimer `forwardRef`** (`Button.tsx`, `Field.tsx`). React 19 accepte `ref` comme prop normale :

```tsx
// src/components/ui/Button.tsx (React 19)
import type { ButtonHTMLAttributes, Ref } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ className = "", variant = "primary", size = "md", ref, ...props }: ButtonProps) {
  return <button ref={ref} className={...} {...props} />;
}
```

**B. Migrer la génération en Server Action + `useActionState`** :

```ts
// src/app/generate/actions.ts
"use server";
import { generateInputSchema } from "@/lib/schemas";
import { generateAnnonces } from "@/lib/anthropic";
import { checkQuota, extractClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type GenerateState =
  | { status: "idle" }
  | { status: "error"; error: string; issues?: unknown }
  | { status: "success"; results: GenerationResult[]; legal_checks: LegalChecks; remaining: number };

export async function generateAction(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const parsed = generateInputSchema.safeParse(extractFromFormData(formData));
  if (!parsed.success) return { status: "error", error: "Données invalides", issues: parsed.error.flatten() };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const quota = checkQuota(`gen:${ip}`, FREE_QUOTA);
  if (!quota.allowed) return { status: "error", error: "Quota gratuit atteint" };

  const r = await generateAnnonces(parsed.data);
  return { status: "success", ...r.parsed, remaining: quota.remaining };
}
```

```tsx
// GeneratorClient.tsx
"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Génération…" : "Générer"}</Button>;
}

export default function GeneratorClient() {
  const [state, action] = useActionState(generateAction, { status: "idle" });
  return (
    <form action={action}>
      {/* champs */}
      <SubmitButton />
      {state.status === "error" && <p>{state.error}</p>}
      {state.status === "success" && <Results data={state} />}
    </form>
  );
}
```

Gain : suppression de la route `/api/generate`, plus de `setLoading`/`setError`/`setResults` manuels, formData géré nativement, validation Zod centralisée.

**C. Ajouter `useOptimistic`** pour les toggles de formats si l'on veut un feedback instantané (mineur).

---

## 3. TypeScript

### Etat actuel

- `tsconfig.json` : `strict: true`, `target: ES2022`, `moduleResolution: bundler`, alias `@/*`. Configuration saine.
- Pas de `any` explicite ; mais quelques `unknown` mal narrowés et des casts dangereux subsistent.
- `GeneratorClient.tsx` redéfinit **localement** des types `GenerationResult` et `LegalChecks` qui existent déjà (au cast près) dans `src/lib/anthropic.ts → GenerateResult["parsed"]`. **Duplication de types** entre client et serveur.
- Plusieurs casts `as string` non sûrs dans la construction du payload (l.91-115) : `fd.get("propertyType") as string` — si le champ est absent ou un `File`, on ment au compilateur. Heureusement Zod re-valide derrière.
- `extractJson` (`src/lib/anthropic.ts:80`) déclare un retour `string` mais ne narrow pas le `fence[1]` qui pourrait être `undefined` (Node/Bun TS strict s'en plaint avec `noUncheckedIndexedAccess`, non activé ici → manque d'option).
- `xff.split(",")[0]!` (`rate-limit.ts:45`) utilise `!` non nécessaire si on garde un fallback typé.
- `extractClientIp` retourne `string` mais `"anonymous"` est un mauvais signal — typer comme `string | "anonymous"` ou retourner `null` serait plus parlant.

### Manques côté tsconfig

- `noUncheckedIndexedAccess: true` — éviterait les `[0]!`, le `fence[1]` non vérifié, etc.
- `noImplicitOverride: true`.
- `verbatimModuleSyntax: true` (Next 15 friendly).
- Pas de fichier `types/` ou `src/types/` pour les types partagés ; chaque fichier ré-déclare.

### Sévérité

**Important** — duplication de types client/serveur ; `noUncheckedIndexedAccess` non activé.

### Recommandation

**A. Exporter et réutiliser les types depuis `src/lib/anthropic.ts`** :

```ts
// src/lib/anthropic.ts
export interface AnnonceResult {
  format: "seloger" | "leboncoin" | "instagram" | "facebook" | "brochure";
  title: string;
  body: string;
  hashtags: string[];
}

export interface LegalChecks { /* ... */ }

export interface GenerateResult {
  raw: string;
  parsed: { results: AnnonceResult[]; legal_checks: LegalChecks };
  usage: { input_tokens: number; output_tokens: number; cache_read?: number };
}
```

Puis dans `GeneratorClient.tsx` : `import type { AnnonceResult, LegalChecks } from "@/lib/anthropic"` (et supprimer les types locaux).

**B. Renforcer `tsconfig.json`** :

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**C. Mieux inférer Zod côté formulaire** : utiliser `z.coerce.number()` pour ne pas devoir convertir à la main `Number(fd.get(...))`. Voir §4.

---

## 4. Zod — schémas, transforms, refinements

### Etat actuel

- Un seul schéma : `generateInputSchema` (`src/lib/schemas.ts`). Bien découpé en sous-enums (`dpeClass`, `propertyType`, `transactionType`) — bonne pratique.
- `GenerateInput` est inféré depuis le schéma. Bon.
- Les paires de coûts énergie (`dpeYearlyCostMin/Max`) ne sont pas reliées : on peut passer `Min=5000, Max=100` sans erreur.
- `dpe`/`ges` optionnels mais **pas de refinement** type "si transaction = location, alors dpe requis" (obligation LCAP depuis 01/07/2021, rappelée dans `prompts.ts`).
- `inCopro: true` mais `coproLots/coproYearlyCharges` absents : pas de refinement.
- `honorairesTTC` requis si `transactionType === "location"` selon la loi : pas de refinement (le prompt système le rappelle, mais le schéma laisse passer).
- Aucun `.transform()` : la conversion `FormData → object` est faite manuellement dans `GeneratorClient.tsx:90-115` (`numberOrUndef`, `optionalString`, `=== "on"`). Zod 3 `z.coerce` + `.transform` pourrait absorber tout ça.
- Pas de schéma de **réponse** ADEME ni de réponse Claude. `parsed = JSON.parse(jsonStr)` dans `anthropic.ts:64` est typé via un cast `GenerateResult["parsed"]` sans validation runtime. Si Claude renvoie un JSON mal formé, l'erreur arrive uniquement côté client à l'affichage.

### Sévérité

**Important** — refinements manquants (risque légal côté contenu généré), absence de validation Zod de la réponse LLM (risque runtime).

### Recommandation

**A. Refinements business** :

```ts
export const generateInputSchema = z.object({ /* ... */ })
  .superRefine((data, ctx) => {
    if (data.dpeYearlyCostMin != null && data.dpeYearlyCostMax != null
        && data.dpeYearlyCostMin > data.dpeYearlyCostMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dpeYearlyCostMax"],
        message: "Coût max doit être >= coût min",
      });
    }
    if (data.transactionType === "location" && data.honorairesTTC == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["honorairesTTC"],
        message: "Honoraires TTC obligatoires en location (décret 2014-890)",
      });
    }
    if (data.inCopro && data.coproLots == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coproLots"],
        message: "Nombre de lots requis en copropriété (loi ALUR)",
      });
    }
  });
```

**B. Schéma FormData direct (élimine `numberOrUndef`/`optionalString`)** :

```ts
export const generateFormSchema = z.object({
  surface: z.coerce.number().int().positive().max(100000),
  rooms: z.coerce.number().int().min(0).max(50).optional().or(z.literal("").transform(() => undefined)),
  price: z.coerce.number().positive(),
  inCopro: z.preprocess(v => v === "on", z.boolean()),
  // ...
});
```

**C. Schéma de réponse Claude** dans `anthropic.ts` :

```ts
const annonceResultSchema = z.object({
  format: z.enum(["seloger","leboncoin","instagram","facebook","brochure"]),
  title: z.string(),
  body: z.string(),
  hashtags: z.array(z.string()).default([]),
});
const claudeResponseSchema = z.object({
  results: z.array(annonceResultSchema).min(1),
  legal_checks: z.object({
    dpe_mentioned: z.boolean(),
    ges_mentioned: z.boolean(),
    copro_disclosed: z.boolean(),
    honoraires_disclosed: z.boolean(),
    f_or_g_warning: z.boolean(),
  }),
});

const parsed = claudeResponseSchema.parse(JSON.parse(jsonStr)); // au lieu de cast brut
```

**D. Schéma de réponse ADEME** dans `dpe.ts` : valider via Zod plutôt que `typeof === "number"` à la main, ce qui supprime ~15 lignes de code défensif.

---

## 5. Hooks / state / race conditions

### Etat actuel

`GeneratorClient.tsx` détient **8 `useState` indépendants** : `loading`, `error`, `results`, `legalChecks`, `activeTab`, `remaining`, `formats`, `dpeLookupLoading`, `dpeLookupMsg`. → état fragmenté.

Problèmes concrets :

- **Race condition** sur `tryDpeLookup` : deux clics rapides → la deuxième réponse peut arriver avant la première, écraser, puis être écrasée par la première (pas d'`AbortController`).
- Idem `onSubmit` : pas d'annulation de la requête `/api/generate` si l'utilisateur soumet à nouveau pendant la génération (atténué par `disabled={loading}`, OK).
- `setLoading(false)` dans `finally` mais en cas d'erreur 429, la branche fait `return` après `setError` → `setLoading(false)` est tout de même appelé par `finally`. OK.
- `activeTab` est piloté à la fois par le user (`onClick`) et par `setResults` (l.134). Le `useEffect` manquant pour réinitialiser l'onglet quand `formats` change est un trou (si un format est désélectionné, son `activeTab` peut rester orphelin → `.filter().map()` renvoie vide silencieusement).
- L'`activeTab` est une `string` plutôt que `Format` typé → on a un `?? r.format` qui ne lève pas si la valeur sort de l'enum.

### Sévérité

**Important** (race condition DPE) + **Mineur** (state fragmenté).

### Recommandation

**A. AbortController sur les fetch** :

```ts
const abortRef = useRef<AbortController | null>(null);

async function tryDpeLookup(...) {
  abortRef.current?.abort();
  const ctrl = new AbortController();
  abortRef.current = ctrl;
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    // ...
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    // ...
  }
}
```

**B. Regrouper le state en `useReducer`** (ou directement via `useActionState`, cf. §2) :

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; results: AnnonceResult[]; legalChecks: LegalChecks; remaining: number | null };

const [state, dispatch] = useReducer(reducer, { status: "idle" });
```

**C. Typer `activeTab` en `Format`** et le rétablir via `useEffect` quand `formats` change.

---

## 6. Composants UI — réutilisabilité & accessibilité

### Etat actuel

- `Button` : variantes/sizes/ghost bien gérées, `focus-visible:ring`, `disabled:opacity-50`. Bonne API.
- `Input/Textarea/Select` : minimaliste mais réutilisable. `Label` séparé.
- `forwardRef` utilisé (à supprimer, cf. §2).

### Problèmes d'accessibilité

- **Checkboxes `inCopro`, `coproProcedure`, `honorairesParPart`** : `<input type="checkbox">` brut posés à côté d'un `<label>` qui les enveloppe — l'association est faite par nesting, OK ; mais aucun composant `Checkbox` réutilisable. Duplication.
- **Pas d'attribut `aria-invalid` / `aria-describedby`** quand le state d'erreur est affiché. L'erreur globale `setError` n'est pas associée aux champs.
- **Le bouton "Auto via ADEME"** (l.213-226) ne décrit pas son état avec `aria-busy={dpeLookupLoading}` ni `aria-live` pour l'annonce du résultat (`dpeLookupMsg`).
- **`<details>` FAQ** (`page.tsx:180`) : OK natif, mais pas de `<summary>` stylé pour focus visible — héritage du browser.
- **`<pre className="whitespace-pre-wrap font-sans">`** (l.411) pour afficher le body : `<pre>` impose une sémantique préformatée — préférer `<div>` + `white-space: pre-wrap` pour la sémantique. Mineur.
- **Pas de gestion du focus** après soumission réussie : le focus reste sur le bouton submit, mais le résultat apparaît dans une autre colonne — un screen reader rate l'info. Ajouter `role="status"` / `aria-live="polite"` sur le bloc résultat.
- **`tabIndex` / ordre de tab** : pas explicite, l'ordre DOM marche.
- **Pas de `aria-label` sur le bouton "Copier"** — texte suffisant donc OK.
- **Champ "Atouts"** : pas de `<Label>` du tout (l.310-318), juste un `<h2>`. Le `<Textarea>` n'a ni `id` ni `aria-labelledby`.
- **Boutons formats (l.337-349)** : `<button>` toggle sans `aria-pressed={formats.includes(f)}`.
- **Onglets résultats (l.391-403)** : pattern tabs sans `role="tablist"` / `role="tab"` / `role="tabpanel"` ni gestion du clavier (flèches).

### Sévérité

**Important** (a11y plusieurs gaps cumulés, normes RGAA non respectées) + **Mineur** (extraire `Checkbox`).

### Recommandation

**A. Composant `Checkbox` réutilisable** :

```tsx
// src/components/ui/Field.tsx
export function Checkbox({ id, name, label, defaultChecked, checked, onChange }: {
  id: string; name: string; label: string;
  defaultChecked?: boolean; checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input
        id={id} name={name} type="checkbox"
        defaultChecked={defaultChecked} checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--color-border)]"
      />
      {label}
    </label>
  );
}
```

**B. `aria-pressed` sur les toggles** :

```tsx
<button
  type="button"
  aria-pressed={formats.includes(f)}
  onClick={() => toggleFormat(f)}
>
  {FORMAT_LABELS[f]}
</button>
```

**C. Pattern Tabs accessible** : utiliser `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls` + handler `onKeyDown` (←/→), ou intégrer Radix UI Tabs (`@radix-ui/react-tabs`) pour la conformité ARIA.

**D. `aria-live` sur la zone résultats** :

```tsx
<div role="status" aria-live="polite" aria-busy={loading}>
  {results && <Results /> }
</div>
```

**E. Label sur le Textarea "Atouts"** :

```tsx
<Label htmlFor="features">Atouts</Label>
<Textarea id="features" name="features" ... />
```

---

## 7. Conventions de nommage

### Etat actuel

| Élément | Convention attendue | Conformité |
|---|---|---|
| Fichiers composants UI | `Button.tsx`, `Field.tsx` (PascalCase) | Conforme **mais incohérent** avec Next App Router |
| Fichiers de page App Router | `page.tsx`, `layout.tsx`, `route.ts` (lowercase, conventions Next) | Conforme |
| Fichier Client encapsulé | `GeneratorClient.tsx` (PascalCase) | Conforme à la convention "1 fichier = 1 composant exporté default" |
| Fichiers de libs | `dpe.ts`, `prompts.ts`, `schemas.ts`, `rate-limit.ts`, `anthropic.ts` | kebab-case + lowercase OK |
| Variables/fonctions | `camelCase` | OK partout |
| Composants React | `PascalCase` | OK |
| Types/interfaces | `PascalCase` | OK |
| Constantes globales | `SCREAMING_SNAKE_CASE` | OK (`FREE_QUOTA`, `WINDOW_MS`, `ADEME_ENDPOINT`, `FORMAT_LABELS`, `SYSTEM_PROMPT`) |
| Champs JSON renvoyés par API | mix `camelCase` (`remaining`) + `snake_case` (`legal_checks`, `dpe_mentioned`, `cout_total_5_usages_min`) | **Incohérent** |

### Problème

- **Mixed casing dans les payloads JSON** : `legal_checks`, `dpe_mentioned`, `f_or_g_warning` (snake_case) cohabitent avec `propertyType`, `transactionType`, `dpeYearlyCostMin` (camelCase). Choisir camelCase partout (convention TS/JS) ou snake_case partout (convention Python/SQL). Le snake_case vient ici du prompt système et de la réponse Claude — ce qui ne devrait pas dicter la convention API.

### Sévérité

**Mineur** (incohérent mais fonctionnel).

### Recommandation

Adopter **camelCase pour toute la frontière API/TS**, et transformer la sortie Claude :

```ts
// après JSON.parse de la réponse Claude
return {
  results: parsed.results,
  legalChecks: {
    dpeMentioned: parsed.legal_checks.dpe_mentioned,
    gesMentioned: parsed.legal_checks.ges_mentioned,
    coproDisclosed: parsed.legal_checks.copro_disclosed,
    honorairesDisclosed: parsed.legal_checks.honoraires_disclosed,
    forGWarning: parsed.legal_checks.f_or_g_warning,
  },
};
```

Idem pour `DpeRecord` (`classe_dpe`, `cout_total_5_usages_min`) — exposer en `dpeClass`, `costMin` etc. dans l'API publique.

---

## 8. Duplication

### Etat actuel

- **Types `GenerationResult` & `LegalChecks`** définis 2x : dans `GeneratorClient.tsx:9-21` et dans `anthropic.ts:18-35` (au cast près). Cf. §3.
- **Pattern PricingCard** : présent dans `app/page.tsx:254-297` (`PricingCard`) **et** dans `app/pricing/page.tsx:69-102` (inline JSX). Code visuel quasi identique. Au moins 30 lignes dupliquées.
- **Tableau de classes DPE `["A", ..., "G"]`** apparaît 2x dans `GeneratorClient.tsx` (l.236, 245). Devrait sortir en constante (et est déjà l'enum `dpeClass` Zod).
- **Helpers `numberOrUndef` / `optionalString`** (l.464-474) : utilitaires génériques enfouis dans le composant. À déplacer dans `src/lib/form.ts` (ou à supprimer via `z.coerce`, cf. §4).
- **Logique d'extraction d'IP** est custom (`extractClientIp`) alors qu'il existe `next/headers` + des helpers Vercel standard.
- **`<Link>` + `<Button>`** : pattern répété 7 fois dans `page.tsx` / `pricing/page.tsx`. Acceptable, mais un `<LinkButton>` réduirait la friction.

### Sévérité

**Important** (types dupliqués, composant PricingCard dupliqué).

### Recommandation

**A. Extraire `PricingCard` dans `src/components/PricingCard.tsx`** :

```tsx
// src/components/PricingCard.tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface Plan {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}

export function PricingCard({ plan }: { plan: Plan }) { /* ... */ }
```

L'utiliser depuis `app/page.tsx` ET `app/pricing/page.tsx`.

**B. Constante `DPE_CLASSES`** dans `src/lib/schemas.ts` :

```ts
export const DPE_CLASSES = ["A","B","C","D","E","F","G"] as const;
export const dpeClass = z.enum(DPE_CLASSES);
```

Importée par `GeneratorClient.tsx` pour le `.map(...)`.

**C. `src/lib/form.ts`** centralisé pour `numberOrUndef` / `optionalString` (ou supprimer via Zod, préférable).

---

## 9. Gestion des erreurs

### Etat actuel

- API `/api/generate` : `try/catch` autour de `req.json()` et autour de `generateAnnonces()`. Bon.
- API `/api/dpe` : `try/catch` autour de `searchDpeByAddress()`, retourne 502 si l'ADEME tombe. Bon.
- Stripe webhook : `try/catch` autour de `constructEvent`. Bon.
- `console.error("[generate] error:", message)` dans `/api/generate/route.ts:51` : log basique, **aucun observability** (pas de Sentry, OpenTelemetry, etc.).
- **Aucune classe d'erreur typée** : tout passe par `Error` standard ou des `string`. Les statuts HTTP (400, 429, 500, 502, 503) sont décidés ad-hoc à chaque endroit. Pas de helper `APIError`.
- `extractJson` (`anthropic.ts:80`) : retourne la string brute si pas de fence trouvée. Si Claude renvoie du texte non-JSON, le `JSON.parse` lève une `SyntaxError` capturée et relancée en `"Réponse Claude non-JSON"` — OK mais perd la stack.
- Côté client (`GeneratorClient.tsx`), le `catch` lit `e instanceof Error ? e.message : "Erreur inconnue"` — OK mais affiche le message brut à l'utilisateur, ce qui peut leaker des détails techniques (ex : `"ADEME API 502"`).
- Aucun `try/catch` autour de `navigator.clipboard.writeText` (l.426) — peut throw si non-HTTPS ou refus permissions.

### Sévérité

**Important** (pas de classes d'erreur typées, pas d'observability, leak de messages techniques).

### Recommandation

**A. Classes d'erreur métier typées** :

```ts
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: "QUOTA_EXCEEDED" | "INVALID_INPUT" | "LLM_FAILURE" | "ADEME_DOWN" | "STRIPE_INVALID",
    public readonly status: number,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(err: unknown) {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.userMessage, code: err.code } };
  }
  console.error("[unhandled]", err);
  return { status: 500, body: { error: "Erreur serveur" } };
}
```

```ts
// /api/generate/route.ts
try { /* ... */ }
catch (err) {
  const { status, body } = toErrorResponse(err);
  return NextResponse.json(body, { status });
}
```

**B. Sentry (ou équivalent)** branché côté API + client pour capturer les erreurs réelles. Plug-and-play avec Next 15.

**C. Sécurité dans les messages utilisateurs** : ne jamais afficher `err.message` brut côté client. Mapper vers des messages user-friendly.

```ts
} catch (e) {
  console.error(e);
  setError("Impossible de générer pour l'instant. Réessayez dans un instant.");
}
```

---

## 10. Imports / alias `@/*`

### Etat actuel

- L'alias `@/*` → `./src/*` est défini dans `tsconfig.json:17`. Bon.
- Utilisation cohérente dans **tous** les fichiers : `@/components/ui/Button`, `@/lib/schemas`, `@/lib/anthropic`, `@/lib/rate-limit`, `@/lib/dpe`. OK.
- Pas d'import relatif `../../` détecté → bon respect du standard.
- Pas de `import * as ...` abusif.
- `import type` bien utilisé là où c'est purement type (`type FormEvent`, `type ButtonHTMLAttributes`, `type GenerateInput`). Bon.

### Manques mineurs

- Pas d'alias secondaires (`@/components/*`, `@/lib/*`) — `@/*` suffit en pratique mais certaines équipes préfèrent séparer pour faire respecter une architecture. Optionnel.
- L'option `verbatimModuleSyntax: true` n'est pas activée → on perd la vérification stricte que les imports de types sont bien `import type`.

### Sévérité

**OK** — rien à corriger.

### Recommandation

Optionnel : activer `verbatimModuleSyntax: true` (cf. §3) pour forcer la rigueur des `import type`.

---

## Top 5 des refactos prioritaires

| Rang | Refacto | Sévérité | Pourquoi |
|---|---|---|---|
| **1** | **Remplacer la manipulation DOM (`document.getElementById`) par un state React contrôlé** dans `GeneratorClient.tsx`, et préparer une migration vers Server Actions + `useActionState` + `useFormStatus`. | Important / Bloquant moyen terme | Anti-pattern React majeur, fragilise hydratation, bloque les évolutions Next 15 (Server Actions, streaming). Gain immédiat sur la testabilité et l'a11y. |
| **2** | **Ajouter des refinements Zod business + valider la réponse Claude avec Zod**. | Important | Risque légal (annonces locations sans honoraires, copro sans lots) actuellement non garanti côté schéma ; risque runtime (réponse LLM non conforme). Le `prompts.ts` rappelle les règles, le schéma doit les enforcer. |
| **3** | **Supprimer `forwardRef`, dédupliquer les types (`AnnonceResult`/`LegalChecks` exportés), extraire `PricingCard` dans un composant partagé**. | Important | Trois dettes de code rapidement résorbables qui réduisent le périmètre et alignent le projet sur React 19. |
| **4** | **Mettre en place une classe `AppError` + handler central + ne plus exposer les messages techniques côté UI**, brancher Sentry (ou alternative). | Important | Aujourd'hui, aucune observability ; certains messages d'erreur leakent (`"ADEME API 502"`) ; aucune cohérence des codes HTTP. |
| **5** | **Audit a11y du formulaire et des onglets** : `aria-pressed` sur les toggles formats, pattern `role="tablist"`/`role="tab"` clavier-navigable sur les résultats, `aria-live="polite"` sur la zone résultats, labels manquants (champ "Atouts"). | Important | Marché B2B français = exigence RGAA + DGCCRF apprécie une UX professionnelle. Faible coût, forte valeur. |

### Bonus (non prioritaires mais à planifier)

- Activer `noUncheckedIndexedAccess` + `verbatimModuleSyntax` dans `tsconfig.json`.
- Ajouter `loading.tsx` / `error.tsx` / `not-found.tsx` aux segments App Router.
- AbortController sur les fetch côté client pour éviter les race conditions sur le DPE lookup.
- Remplacer le rate-limiter mémoire par Upstash Redis (déjà noté dans `rate-limit.ts`).
- Implémenter le branchement DB du webhook Stripe (TODO laissés).
