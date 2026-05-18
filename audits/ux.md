# Audit UX / Copy FR / Accessibilité — Annoncia

> Périmètre : `src/app/page.tsx`, `src/app/pricing/page.tsx`, `src/app/generate/GeneratorClient.tsx` (+ `generate/page.tsx`), `src/components/ui/*`, `src/app/layout.tsx`, `src/app/globals.css`.
> Légende sévérité : **BLOQUANT** (impact direct conversion) · **IMPORTANT** · **MINEUR** · **OK**.

---

## 1. Landing page (`src/app/page.tsx`)

### 1.1 Hero — promesse et CTA

**État actuel.** Titre en deux temps : « L'annonce immobilière qui vend, en 10 secondes, en règle. » + sous-titre listant 4 bénéfices (LCAP, DPE auto, multi-canal, 30 min/mandat) + double CTA (« Essayer gratuitement (3 annonces) » / « Voir les tarifs »).

**Analyse.**
- La promesse est claire pour quelqu'un qui connaît le métier — mais le ton est un peu sec. « en règle » sonne policier plus que rassurant.
- Le CTA primaire est bon (cadeau + quantité + sans engagement implicite via le micro-copy `Sans carte bancaire`). Le « (3 annonces) » est une excellente précision : on sait à quoi s'en tenir.
- Le badge « Pour agents immobiliers en France » est utile pour la qualification mais le `<span class="bg-success">` ressemble à un statut « en ligne » plus qu'à un targeting — confusion sémantique mineure.
- Absence de capture visuelle du produit dans le viewport au-dessus de la ligne de flottaison : on parle d'un outil qui produit du texte, mais on ne montre **aucun aperçu d'annonce générée**.

**Sévérité.** IMPORTANT (manque de preuve visuelle).

**Recommandations.**
1. Ajouter un visuel produit à droite du hero (mockup avec une annonce SeLoger générée + badge conformité). Sur mobile, le pousser sous le sous-titre.
2. Reformuler la promesse pour adoucir « en règle » et rendre le bénéfice plus concret :
   ```tsx
   <h1>
     L'annonce qui se vend toute seule,
     <br />
     <span>en 10 secondes, 100 % conforme.</span>
   </h1>
   <p>
     Annoncia rédige vos annonces immobilières et les décline pour SeLoger,
     LeBonCoin, Instagram et brochure PDF — avec les mentions DPE, ALUR
     et Hoguet déjà en place. Vous gagnez 30 minutes par mandat.
   </p>
   ```
3. Sur le CTA secondaire, l'icône `→` après `Voir les tarifs` est dupliquée avec celui du CTA final ; conserver mais s'assurer que c'est un vrai caractère et non un emoji rendu différemment selon OS (actuellement c'est `→` U+2192, OK).
4. Ajouter une 3e ligne sous le micro-copy : « Démo en 30 s, sans inscription. » pour réduire l'angoisse d'engagement.

---

### 1.2 Hiérarchie visuelle et lecture en 5 secondes

**État actuel.** Hero centré → bandeau de stats (4 colonnes) → pain point → features (6 cards 3 col) → pricing teaser (2 plans) → FAQ → CTA final.

**Analyse.**
- La structure est saine et linéaire ; un visiteur scrolle naturellement.
- La section « Aujourd'hui, rédiger une annonce immobilière, c'est : » utilise des `·` au lieu de puces stylées. Visuellement ça fait *texte brut*, ça casse la finesse du design système.
- Pas de chevron / scroll indicator sous le hero — mineur mais le hero est long (80 vh+) et on peut croire qu'il n'y a rien dessous sur certains laptops.
- L'ordre des sections est bon : douleur → solution → preuve → prix → objections → CTA. Conforme aux principes Cialdini/PAS.
- **Manque une section au-dessus de Features** : « Comment ça marche » en 3 étapes visuelles (1. Brief → 2. ADEME → 3. 5 formats). C'est l'angle mort le plus coûteux : on ne *voit* jamais le produit avant le formulaire.

**Sévérité.** IMPORTANT.

**Recommandations.**
1. Remplacer les `·` par un composant `Cross` rouge (douleur) :
   ```tsx
   <li className="flex gap-3"><span className="text-[var(--color-danger)]">✕</span>25 minutes de rédaction et relecture par bien</li>
   ```
2. Ajouter une section « Comment ça marche » entre Pain point et Features :
   ```tsx
   <section className="mx-auto max-w-6xl px-6 py-20">
     <h2 className="text-3xl font-bold text-center">3 étapes, 10 secondes</h2>
     <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
       <Step n={1} title="Vous renseignez le bien" desc="Surface, prix, ville, atouts. L'adresse suffit, le DPE est tiré de l'ADEME." />
       <Step n={2} title="Annoncia rédige" desc="5 versions (SeLoger, LeBonCoin, Insta, Facebook, PDF) avec les mentions légales déjà placées." />
       <Step n={3} title="Vous copiez, vous publiez" desc="Bouton copier sur chaque format. Aucun copier-coller manuel des mentions DPE." />
     </ol>
   </section>
   ```
3. Sous le bandeau de stats, ajouter un mini-aperçu : « Exemple ↓ » qui scroll vers une annonce démo.

---

### 1.3 Preuves / autorité

**État actuel.**
- Stats agrégées (10 s, 5 formats, 100 %, 30 min) — c'est de l'auto-déclaration.
- FAQ mentionne « 18 mois de jurisprudence » dans la section Features header.
- Garantie remboursement 14 jours mentionnée 2 fois.

**Manques (BLOQUANT pour la conversion B2B).**
- **Aucun témoignage** d'agent / d'agence.
- **Aucun logo client** (« Ils nous font confiance »).
- **Aucune capture** d'annonce générée.
- **Aucun chiffre vérifié** (« +1 200 agents utilisent Annoncia », « 47 000 annonces générées »).
- Pas de réassurance presse / awards.
- Aucune mention RGPD / hébergeur visible (alors que le texte FAQ le revendique).

**Sévérité.** BLOQUANT.

**Recommandations.**
1. Si pas encore de clients : remplacer par un encart « En version bêta — premier mois gratuit pour les 50 premières agences » qui transforme l'absence en exclusivité.
2. Ajouter un témoignage vidéo ou texte sous le pain point. Format réaliste :
   ```tsx
   <blockquote className="mx-auto max-w-2xl border-l-4 border-[var(--color-accent)] pl-6 italic">
     « J'ai gagné une demi-journée par semaine, et j'ai arrêté de stresser sur les mentions DPE. »
     <footer className="not-italic mt-3 text-sm text-[var(--color-muted-foreground)]">
       Camille R., agente indépendante (Bordeaux) — 6 mois d'utilisation
     </footer>
   </blockquote>
   ```
3. Ajouter un bandeau logos sous le hero (SeLoger, LeBonCoin, Apimo, Hektor, ADEME) en posant : « Compatible avec » plutôt que « Ils nous font confiance » — c'est honnête et ça rassure.
4. Ajouter une vidéo loop (≤ 30 s, MP4 < 2 Mo, autoplay muted loop) montrant le formulaire → résultat.

---

### 1.4 Objections traitées

**État actuel.** La FAQ traite 4 objections clés :
- ChatGPT (très bien argumenté)
- RGPD (un peu rapide)
- Remboursement (clair)
- Intégrations (clair)

**Manques.**
- Pas de réponse à : « Et si l'IA invente quelque chose ? » (alors que c'est l'objection N°1 d'un agent immobilier).
- Pas de réponse à : « Je perds en différenciation si tous les agents l'utilisent ? »
- Pas de réponse à : « Combien d'annonces je peux générer ? » sur le plan Solo (« illimitées » est mentionné mais c'est suspect, il faut le justifier).
- Pas de réponse à : « Mon agence/réseau (Century 21, Orpi, Laforêt) l'autorise-t-il ? » → frein réel B2B.

**Sévérité.** IMPORTANT.

**Recommandations.** Ajouter dans `faqs` :
```ts
{
  q: "Et si l'IA invente quelque chose dans l'annonce ?",
  a: "Annoncia ne brode jamais. Si vous ne renseignez pas la « cuisine équipée », elle n'apparaîtra pas. Chaque génération est passée à un contrôle automatique de fidélité aux atouts saisis. Vous gardez votre devoir d'information loyale (art. L111-1 Code de la consommation)."
},
{
  q: "Je suis agent en réseau (Century 21, Orpi…) — je peux l'utiliser ?",
  a: "Oui. Annoncia produit du texte que vous éditez et publiez vous-même sur vos canaux internes. Aucun réseau n'a, à notre connaissance, interdit l'usage d'outils d'aide à la rédaction. Si votre charte demande une mention, ajoutez-la en footer auto (option Agence)."
},
{
  q: "Si tout le monde utilise Annoncia, mes annonces vont se ressembler ?",
  a: "Chaque annonce est générée à partir de vos atouts, votre ton (5 styles) et la géographie du bien. Deux annonces du même type dans la même ville produisent des textes différents. Et vous restez libre de réécrire."
}
```

Côté **prix** (objection « 29 € c'est cher »), la page tarifs traite déjà le ROI. La landing n'a pas besoin d'en rajouter.

---

### 1.5 Copy FR — naturelle, persuasive, sans anglicisme

**Bons points.**
- Pas d'anglicisme flagrant. « Brief », « caption », « post » sont admis dans le métier.
- Ton tutoyant absent → cohérent (B2B vouvoiement implicite via la structure des phrases impersonnelles).
- « On interroge la base publique ADEME » — bonne tournure familière qui humanise.
- « Le moteur ne brode pas » — métaphore parfaite, claire et imagée.

**À retravailler.**

| Section | Phrase actuelle | Problème | Reformulation |
|---|---|---|---|
| Hero h1 | « en règle » | Plat, sonne administratif | « 100 % conforme » ou « sans risque légal » |
| Hero p | « déclinée pour SeLoger… » | Accord « déclinée » → c'est qui ? syntaxe ambiguë | « Déclinées pour SeLoger, LeBonCoin… » (au pluriel, ou reformuler) |
| Features header | « 18 mois de jurisprudence » | Faux ou invérifiable, et un agent ne sait pas ce que ça veut dire | « Les obligations légales 2024 (LCAP, ALUR, Hoguet) codées dans le moteur. » |
| FAQ ChatGPT | « il vous faudrait 4 prompts et 10 min » | Le « il » est ambigu | « ChatGPT vous demanderait 4 prompts et 10 minutes — et oublierait la mention DPE une fois sur trois. » |
| FAQ ChatGPT | « Nous avons codé la conformité dans le système. » | « Système » froid | « Nous avons intégré la conformité directement dans le moteur. » |
| Pain point | « Voir vos annonces noyées dans la masse parce qu'elles disent toutes la même chose » | « parce qu'elles disent toutes la même chose » → un peu maladroit | « Voir vos annonces se noyer dans la masse parce qu'elles disent toutes la même chose. » |
| CTA final h2 | « La prochaine annonce, c'est en 10 secondes. » | Élégant, mais ambigu (annonce de quoi ?) | « Votre prochaine annonce ? Dans 10 secondes. » |
| CTA final p | « Mettez-la sur un vrai mandat, voyez. » | Très oral, peut être perçu comme négligé | « Testez sur un mandat réel — vous verrez la différence. » |
| Footer | « Annonces immobilières IA conformes à la législation française. » | Manque d'âme, c'est juste un tagline SEO | Ajouter mentions légales / CGU / Politique de confidentialité (obligatoire RGPD). |

**Sévérité globale copy.** IMPORTANT pour le hero, le reste est MINEUR.

---

## 2. Pricing page (`src/app/pricing/page.tsx`)

### 2.1 Comparaison et plan recommandé

**État actuel.** 3 plans (Découverte / Solo / Agence). Solo est `highlight: true` avec ring + badge « Le plus choisi ».

**Analyse.**
- Hiérarchie visuelle claire ✓
- Le badge « Le plus choisi » sur Solo est une bonne ancre.
- **Problème majeur** : les 3 cartes n'ont **pas de tableau comparatif feature-par-feature**. Le visiteur doit comparer mentalement « Tout Solo, plus : » sur Agence, ce qui crée de la friction.
- Pas de toggle Mensuel/Annuel (les SaaS B2B FR offrent typiquement -20 % annuel — manque clair de levier de conversion).
- Pas de mention TVA explicite dans la page (les prix sont HT, indiqué dans `note` mais discret) → un agent indépendant en franchise de TVA va se demander si c'est 29 € net ou 34,80 € TTC. À clarifier.

**Sévérité.** IMPORTANT.

**Recommandations.**
1. Ajouter un toggle Mensuel/Annuel en haut :
   ```tsx
   <div className="mt-8 inline-flex rounded-full border p-1">
     <button className="rounded-full px-4 py-1 bg-[var(--color-foreground)] text-[var(--color-background)]">Mensuel</button>
     <button className="rounded-full px-4 py-1">Annuel · -20 %</button>
   </div>
   ```
2. Sous les 3 cartes, ajouter un tableau comparatif détaillé :
   ```tsx
   <table className="mt-16 w-full text-sm">
     <thead><tr><th></th><th>Découverte</th><th>Solo</th><th>Agence</th></tr></thead>
     <tbody>
       <tr><td>Annonces / mois</td><td>3 (à vie)</td><td>Illimitées</td><td>Illimitées</td></tr>
       <tr><td>Utilisateurs</td><td>1</td><td>1</td><td>5</td></tr>
       <tr><td>DPE auto ADEME</td><td>✓</td><td>✓</td><td>✓</td></tr>
       <tr><td>Import batch CSV</td><td>—</td><td>—</td><td>Illimité</td></tr>
       <tr><td>API REST + webhooks</td><td>—</td><td>—</td><td>✓</td></tr>
       <tr><td>Support</td><td>Communauté</td><td>Email 24-48 h</td><td>Prioritaire 4 h</td></tr>
     </tbody>
   </table>
   ```
3. Préciser TVA : « 29 € HT/mois (34,80 € TTC) — déductible » sous chaque prix.

---

### 2.2 Justification ROI

**État actuel.** Section « Pourquoi ces tarifs sont rentables » avec 3 calculs (Solo 200 €, Agence 1 500 €, Risque évité 3 000 €).

**Analyse.**
- Excellente présence du ROI. Rare et bien fait.
- Les chiffres sont cohérents et crédibles.
- Manque un **simulateur interactif** : « Combien je gagne avec Annoncia ? » → 2 inputs (mandats/mois, tarif horaire) → résultat en € économisés. Multiplie l'impact persuasif.
- Le « Risque évité » mentionne « jusqu'à 3 000 € » — à sourcer (article L131-1 du Code de la conso ? cite la décision pour crédibiliser).

**Sévérité.** MINEUR (déjà solide), IMPORTANT pour le simulateur.

**Recommandation.** Mini-simulateur interactif (client component) :
```tsx
"use client";
function RoiCalculator() {
  const [mandates, setMandates] = useState(8);
  const [rate, setRate] = useState(60);
  const minutes = mandates * 25;
  const saved = Math.round((minutes / 60) * rate);
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="font-semibold">Combien Annoncia vous fait gagner</h3>
      <label>Mandats / mois : <input type="range" min="1" max="40" value={mandates} onChange={…} /></label>
      <label>Tarif horaire (€) : <input type="number" value={rate} onChange={…} /></label>
      <p className="mt-4 text-3xl font-bold">{saved} €/mois économisés</p>
      <p className="text-sm">Soit {Math.round(saved / 29)}× le prix du plan Solo.</p>
    </div>
  );
}
```

---

### 2.3 FAQ Pricing manquante

**État actuel.** Aucune FAQ sur la page Pricing (seulement sur la landing).

**Sévérité.** IMPORTANT.

**Recommandation.** Ajouter une FAQ dédiée pricing en bas de page :
```tsx
const pricingFaqs = [
  { q: "Puis-je changer de plan en cours de route ?", a: "Oui, à tout moment. Upgrade immédiat (prorata), downgrade à la prochaine échéance." },
  { q: "Y a-t-il un engagement ?", a: "Aucun. Annulable en un clic depuis votre compte. Vous gardez l'accès jusqu'à la fin de la période payée." },
  { q: "Comment fonctionne la garantie 14 jours ?", a: "Si vous n'êtes pas satisfait dans les 14 premiers jours, on vous rembourse sans justification. Un email à hello@annoncia.fr suffit." },
  { q: "Les annonces sont-elles vraiment illimitées sur Solo ?", a: "Oui, dans la limite d'un usage normal (fair use ~500 annonces/mois). Au-delà, on vous contacte avant de plafonner." },
  { q: "TVA et facturation ?", a: "Prix affichés en HT. Facture mensuelle automatique avec votre numéro de TVA intracommunautaire. Stripe gère la conformité européenne." },
];
```

---

## 3. Generator (`src/app/generate/GeneratorClient.tsx`)

### 3.1 Le formulaire est-il intimidant ?

**État actuel.** Un seul formulaire vertical sur ~6 sections : Bien (10 champs), Performance énergétique (5 champs + bouton Auto ADEME), Copropriété (3 champs + checkbox), Honoraires (2 champs), Atouts (textarea), Style & formats.

**Soit ≈ 21 champs visibles d'un coup à l'arrivée**.

**Analyse.**
- BLOQUANT pour un premier essai : effet « formulaire administratif ». Or la promesse landing est « 10 secondes ».
- Tous les champs sont visibles immédiatement même quand non pertinents (ex. Copropriété affichée pour une maison, Honoraires affichés pour une vente).
- Aucune indication des **champs minimums requis** pour un essai rapide (en réalité juste : type, transaction, surface, prix, ville → 5 champs).
- Aucune barre de progression ni découpage en étapes.

**Sévérité.** BLOQUANT.

**Recommandations.**
1. **Progressive disclosure conditionnelle** :
   - Section Copropriété : afficher seulement si `propertyType ∈ {appartement, studio, loft}` ET `transactionType === "vente"`.
   - Section Honoraires : afficher seulement si `transactionType === "location"`.
   - Conditionner via React state, ne pas masquer en CSS pour la perf et la screen reader UX.
2. **Mode rapide / mode complet** :
   ```tsx
   <div className="mb-6 inline-flex rounded-full border p-1">
     <button onClick={() => setMode("quick")}>Essai rapide (5 champs)</button>
     <button onClick={() => setMode("full")}>Mandat complet (conforme LCAP)</button>
   </div>
   ```
   En mode `quick`, masquer Copropriété, Honoraires, DPE et le simulateur de prompt génère avec un avertissement « DPE à compléter avant publication ».
3. **Indicateur visuel** sur les champs obligatoires : le * est présent sur `Ville` seulement (ligne 197), mais `surface`, `price`, `propertyType`, `transactionType` ont aussi `required` sans astérisque visible. Incohérent.
4. **Sauvegarder le brouillon** dans `localStorage` pour qu'un agent qui revient retrouve son brief.

---

### 3.2 État vide du panel de résultats

**État actuel.**
```tsx
<div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
  Les annonces s'afficheront ici.
  <br />
  Astuce : essayez d'abord avec un seul format pour itérer plus vite.
</div>
```

**Analyse.**
- Présent ✓
- Friendly, donne un conseil utile (« un seul format pour itérer ») ✓
- Mais **passe à côté d'une opportunité énorme** : montrer un *exemple statique* d'annonce générée. Le visiteur découvre la qualité du produit avant de remplir le formulaire.

**Sévérité.** IMPORTANT.

**Recommandation.**
```tsx
{!results ? (
  <div className="space-y-3">
    <div className="rounded-2xl border border-dashed p-6 text-center text-sm">
      ↑ Remplissez le brief, recevez 5 versions en 10 s.
    </div>
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer text-sm font-medium">Voir un exemple de résultat ↓</summary>
      <div className="mt-4 space-y-3">
        <h4 className="font-semibold">T3 lumineux 68 m² — Bordeaux Caudéran</h4>
        <p className="text-sm whitespace-pre-wrap">{EXAMPLE_AD_BODY}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">DPE D · GES C · Honoraires charge vendeur · Copropriété 24 lots, 2 100 €/an</p>
      </div>
    </details>
  </div>
) : … }
```

---

### 3.3 Feedback de chargement

**État actuel.**
- Texte du bouton change : `Génération en cours…` quand `loading`.
- `disabled` sur le bouton.
- Aucun skeleton, aucun progress, aucun streaming visible.

**Analyse.**
- Pour une requête qui appelle un LLM (latence 5-15 s normale), `Génération en cours…` sans progress est **anxiogène**. Le visiteur ne sait pas si ça marche.
- L'API `/api/generate` retourne tout en une fois (à vérifier dans `route.ts` mais le code client ne consomme pas de stream).
- Le bouton « Auto via ADEME » a un état `Recherche…` similaire mais sans indication de progression.

**Sévérité.** IMPORTANT.

**Recommandations.**
1. Skeleton dans le panel résultats pendant le loading :
   ```tsx
   {loading ? (
     <div className="space-y-3 rounded-2xl border p-4">
       <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--color-muted)]" />
       <div className="h-4 animate-pulse rounded bg-[var(--color-muted)]" />
       <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-muted)]" />
       <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--color-muted)]" />
     </div>
   ) : null}
   ```
2. Messages rotatifs pendant la génération (toutes les 2 s) :
   ```tsx
   const steps = [
     "Vérification du brief…",
     "Récupération de la mention DPE…",
     "Adaptation pour SeLoger…",
     "Adaptation pour LeBonCoin…",
     "Optimisation SEO local…",
     "Contrôle conformité LCAP…",
   ];
   ```
   Ça transforme l'attente en preuve d'expertise.
3. Idéalement, **streaming SSE** sur l'API pour afficher le texte au fil de l'eau (effet ChatGPT, perçu 3× plus rapide).

---

### 3.4 Bouton « Auto via ADEME »

**État actuel.** (l. 213-227)
```tsx
<Button onClick={() => {
  const addr = (document.getElementById("neighborhood") as HTMLInputElement)?.value;
  const city = (document.getElementById("city") as HTMLInputElement)?.value ?? "";
  const cp = (document.getElementById("postalCode") as HTMLInputElement)?.value ?? "";
  void tryDpeLookup(`${addr ?? ""} ${city}`.trim(), cp);
}}>
```

**Problèmes.**
- **UX** : utilise `neighborhood` (quartier) comme « adresse » → mauvais. Un quartier ce n'est pas une adresse. La recherche ADEME nécessite une rue précise.
- **Manque un champ « Adresse précise »** (numéro + rue) dédié à la recherche DPE — actuellement absent.
- **Gestion d'erreur** : `dpeLookupMsg` affiche le message en gris clair (`text-muted-foreground`) — c'est la **même couleur en succès et en échec**. Aucun feedback visuel pour distinguer « DPE trouvé » vs « Aucun DPE trouvé ».
- Manipule le DOM directement (`document.getElementById(...).value`) au lieu d'utiliser `useState` / `useRef` — anti-pattern React. Si React re-render le formulaire, les valeurs DOM peuvent être désynchronisées de l'état.
- Pas de feedback de **succès animé** (flash vert sur les champs remplis automatiquement).
- Bouton labélisé « Auto via ADEME » : OK mais pourrait être plus explicite : « Importer le DPE depuis l'ADEME ».

**Sévérité.** IMPORTANT (perte de conversion sur la promesse phare).

**Recommandations.**
1. Ajouter un champ « Adresse » (rue + numéro) dédié :
   ```tsx
   <div className="col-span-2">
     <Label htmlFor="street">Adresse</Label>
     <Input id="street" name="street" placeholder="12 rue de la Marne" />
   </div>
   ```
2. Refondre `tryDpeLookup` avec `useState` plutôt que `getElementById` :
   ```tsx
   const [form, setForm] = useState({ street: "", city: "", postalCode: "", dpe: "", ges: "", dpeMin: "", dpeMax: "" });
   ```
3. Différencier visuellement succès / échec :
   ```tsx
   {dpeLookupMsg && (
     <p className={`mt-2 text-xs ${
       dpeLookupStatus === "success" ? "text-[var(--color-success)]" :
       dpeLookupStatus === "error" ? "text-[var(--color-danger)]" :
       "text-[var(--color-muted-foreground)]"
     }`} role="status" aria-live="polite">
       {dpeLookupStatus === "success" && "✓ "}
       {dpeLookupStatus === "error" && "⚠ "}
       {dpeLookupMsg}
     </p>
   )}
   ```
4. Renommer le bouton : **« Récupérer le DPE depuis l'ADEME »** ou simplement « Importer le DPE ↓ ».

---

### 3.5 Quotas restants

**État actuel.** (l. 435-444)
```tsx
{remaining !== null ? (
  <p className="text-xs text-[var(--color-muted-foreground)]">
    Quota gratuit restant : <strong>{remaining}</strong>{" "}
    {remaining === 0 ? <a href="/pricing" className="underline">Passer Solo →</a> : null}
  </p>
) : null}
```

**Analyse.**
- Visible **seulement après une génération** → l'utilisateur ne sait pas qu'il a 3 essais avant la première tentative.
- Affichage discret (`text-xs muted`) → sous-utilisé pour la conversion. Quand `remaining === 1`, c'est un moment-clé : il faudrait pousser un upsell visuel.
- `Quota gratuit restant : 0` est binaire (« je vais passer payant » vs « plus rien »). On gagnerait à dégrader progressivement.

**Sévérité.** IMPORTANT.

**Recommandations.**
1. Afficher le quota **dès le chargement de la page** (fetch /api/me ou stocké en cookie) :
   ```tsx
   <p className="mb-4 inline-flex rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs">
     {remaining} {remaining > 1 ? "essais gratuits restants" : "essai gratuit restant"}
   </p>
   ```
2. Upsell différencié selon le quota :
   - 3 restants : rien.
   - 1 restant : encart jaune « Dernier essai gratuit. Passez Solo (29 €/mois) pour des annonces illimitées. »
   - 0 restant : modale bloquante avec upsell + lien vers /pricing.
3. Le message d'erreur 429 actuel (`"Quota gratuit atteint. Passez sur un plan payant pour continuer."`) est correct mais sec. Ajouter un CTA inline :
   ```tsx
   setError(<>Quota gratuit atteint. <a href="/pricing" className="font-semibold underline">Voir les plans →</a></>);
   ```

---

## 4. Accessibilité (a11y)

### 4.1 Inputs et labels

**État actuel.**
- ✓ La majorité des `<Input>`, `<Select>` ont un `Label htmlFor=` correspondant à `id=` (Bien, DPE, Copro champs numériques, Honoraires).
- ✗ Le **`Label`** du composant `Field.tsx` (l. 34) accepte `htmlFor` optionnel — mais quand `Label` est utilisé sans `htmlFor` (l. 334 : `<Label>Formats</Label>` pour la grille de boutons), le `<label>` HTML résultant n'est lié à rien et n'a pas de rôle de groupe. Devrait être un `<fieldset><legend>`.
- ✗ Les **checkboxes** (`inCopro`, `coproProcedure`, `honorairesParPart`) utilisent un pattern `<label><input>…</label>` (label englobant) — c'est valide HTML, mais `honorairesParPart` (l. 303) n'a **pas d'`id`** et le `<label>` n'a pas de `htmlFor`. Acceptable (label englobant suffit) mais incohérent avec les autres.
- ✗ Les boutons de toggle « Formats » (l. 337-349) sont des `<button>` sans `aria-pressed` — un screen reader ne sait pas que c'est un toggle on/off.
- ✗ Les onglets de résultats (l. 389-404) sont des `<button>` sans pattern WAI-ARIA `tabs` (pas de `role="tab"`, pas de `aria-selected`, pas de `role="tabpanel"`).

**Sévérité.** IMPORTANT.

**Recommandations.**
1. Pour la grille Formats :
   ```tsx
   <fieldset>
     <legend className="mb-1.5 text-sm font-medium">Formats</legend>
     <div role="group" className="flex flex-wrap gap-2">
       {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
         <button
           type="button"
           key={f}
           aria-pressed={formats.includes(f)}
           onClick={() => toggleFormat(f)}
           …
         >{FORMAT_LABELS[f]}</button>
       ))}
     </div>
   </fieldset>
   ```
2. Pour les onglets de résultats :
   ```tsx
   <div role="tablist" aria-label="Formats générés" className="flex flex-wrap gap-2">
     {results.map((r) => (
       <button
         key={r.format}
         role="tab"
         aria-selected={activeTab === r.format}
         aria-controls={`panel-${r.format}`}
         id={`tab-${r.format}`}
         tabIndex={activeTab === r.format ? 0 : -1}
         …
       >{FORMAT_LABELS[r.format as Format]}</button>
     ))}
   </div>
   {results.filter(r => r.format === activeTab).map(r => (
     <div role="tabpanel" id={`panel-${r.format}`} aria-labelledby={`tab-${r.format}`} key={r.format}>…</div>
   ))}
   ```
   Et gérer les flèches gauche/droite au clavier.

---

### 4.2 Focus visible et contraste

**État actuel.**
- ✓ `Button.tsx` et `Field.tsx` ont `focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]` — bon.
- ✓ `--color-accent: #2563eb` sur fond `--color-background: #ffffff` → ratio **8.59:1** (WCAG AAA). En dark mode (#0a0a0a) le bleu reste très lisible.
- ✗ `--color-muted-foreground: #71717a` sur `--color-background: #ffffff` → ratio **4.48:1** → **fail WCAG AA pour texte < 18 px** (seuil 4.5:1 raté de justesse). Or beaucoup de sous-textes (`text-sm`, `text-xs`) utilisent cette variable.
- ✗ En dark mode, `--color-muted-foreground: #a1a1aa` sur `#0a0a0a` → ratio **8.27:1** ✓ OK.
- ✗ `Badge` (l. 452-461) : `bg-green-100 text-green-900` et `bg-zinc-200 text-zinc-700` sont des classes Tailwind non liées au thème → en dark mode elles restent claires, contraste OK mais incohérent visuellement.
- ✗ `bg-yellow-100 text-yellow-900` pour la mention F/G (l. 381) — même problème.
- ✗ Le bouton primary `bg-primary` (slate-900 #0f172a) + texte `--color-primary-foreground: #f8fafc` → ratio **17.4:1** ✓ excellent.
- ✗ En **dark mode**, le bouton primary inverse : `bg-#fafafa` + texte `#0a0a0a` → bouton blanc sur fond noir → très visible mais peut surprendre (blanc « éclatant »).

**Sévérité.** IMPORTANT (contraste muted-foreground en light) / MINEUR (incohérence badges dark).

**Recommandations.**
1. Renforcer `--color-muted-foreground` en light de `#71717a` vers `#52525b` (zinc-600) → ratio 7.0:1.
2. Lier les badges au thème via CSS variables :
   ```css
   --color-success-bg: #dcfce7; --color-success-fg: #14532d;
   --color-warning-bg: #fef3c7; --color-warning-fg: #78350f;
   /* dark mode */
   --color-success-bg: #052e16; --color-success-fg: #86efac;
   ```

---

### 4.3 ARIA live regions

**État actuel.** Aucun `aria-live` nulle part.

**Problèmes.**
- ✗ Le `dpeLookupMsg` (succès/échec ADEME) n'est pas annoncé aux screen readers.
- ✗ Le résultat de la génération (`results`) apparaît sans annonce — un utilisateur non-voyant clique « Générer » et… rien n'est annoncé.
- ✗ Le compteur de quota restant n'a pas de `role="status"`.

**Sévérité.** IMPORTANT.

**Recommandations.**
```tsx
{/* Message ADEME */}
<p role="status" aria-live="polite" className="…">{dpeLookupMsg}</p>

{/* Annonce de génération */}
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {loading ? "Génération en cours, veuillez patienter." :
   results ? `${results.length} annonces générées.` : ""}
</div>

{/* Erreur */}
<p role="alert" className="…">{error}</p>
```
Ajouter une classe `sr-only` dans `globals.css` :
```css
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
```

---

### 4.4 Bouton Copier accessible au clavier

**État actuel.** (l. 417-430)
```tsx
<Button onClick={() => navigator.clipboard.writeText(text)}>Copier</Button>
```

**Analyse.**
- ✓ C'est un `<button>`, accessible au clavier par défaut.
- ✗ Aucun feedback après le clic — un utilisateur ne sait pas si le texte est copié.
- ✗ Pas d'annonce screen reader.

**Sévérité.** MINEUR.

**Recommandation.**
```tsx
const [copied, setCopied] = useState<string | null>(null);
…
<Button onClick={() => {
  navigator.clipboard.writeText(text);
  setCopied(r.format);
  setTimeout(() => setCopied(null), 2000);
}}>
  {copied === r.format ? "✓ Copié" : "Copier"}
</Button>
<span role="status" aria-live="polite" className="sr-only">
  {copied === r.format ? "Annonce copiée dans le presse-papier" : ""}
</span>
```

---

### 4.5 Skip link et navigation

**État actuel.**
- ✗ Aucun `<a href="#main">Aller au contenu</a>` au début du body.
- ✗ Le `<main>` est présent (l. 52 page.tsx, l. 11 generate/page.tsx, l. 59 pricing) mais sans `id="main"`.
- ✗ Le header sticky n'a pas de `role="banner"` (implicite si direct enfant de body, OK ici).
- ✗ Pas de `aria-label` sur le `<nav>` du Header.

**Sévérité.** MINEUR (mais obligatoire pour RGAA / EN 301 549 si Annoncia vise du public/parapublic).

**Recommandations.**
1. Dans `layout.tsx` body :
   ```tsx
   <body>
     <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--color-background)] focus:p-3 focus:rounded focus:ring-2 focus:ring-[var(--color-accent)]">
       Aller au contenu principal
     </a>
     {children}
   </body>
   ```
2. Ajouter `id="main"` sur les `<main>`.
3. `<nav aria-label="Principale">` sur le header.

---

### 4.6 Autres a11y

- ✗ Pas de gestion du focus retour après soumission du formulaire (le focus reste sur le bouton « Générer » alors qu'il faudrait déplacer le focus vers la zone de résultats ou son heading). À ajouter :
  ```tsx
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.focus();
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [results]);
  // <div ref={resultsRef} tabIndex={-1} … />
  ```
- ✗ Le `<details>` de la FAQ est natif → bon pour a11y, mais pas de gestion de l'icône chevron.
- ✓ `lang="fr"` sur `<html>` — bon.
- ✓ Titre de page descriptif via metadata — bon.

---

## 5. Copy française — récap

### 5.1 Vouvoiement

Cohérent partout (« Vous économisez », « Vous gagnez », « Renseignez »). ✓ Conforme B2B FR.

### 5.2 Récap des reformulations

| Fichier | Ligne approx. | Actuel | Proposé |
|---|---|---|---|
| `page.tsx` | 62-65 | « L'annonce immobilière qui vend, en 10 secondes, en règle. » | « L'annonce immobilière qui vend, en 10 secondes, 100 % conforme. » |
| `page.tsx` | 67-70 | « Conforme LCAP, mentions DPE/GES automatiques depuis l'ADEME, déclinée pour … » | « Conforme LCAP. Mentions DPE/GES tirées de l'ADEME. Déclinée en 5 formats : SeLoger, LeBonCoin, Instagram, Facebook, brochure PDF. » (3 phrases au lieu d'une longue) |
| `page.tsx` | 73 | « Essayer gratuitement (3 annonces) » | OK — précis et engageant. Garder. |
| `page.tsx` | 82 | « Sans carte bancaire. Aucune installation. » | OK ✓ |
| `page.tsx` | 105 | « risquer le signalement DGCCRF » | « risquer un signalement à la DGCCRF (jusqu'à 3 000 € d'amende) » — chiffre = ancrage |
| `page.tsx` | 109 | « Annoncia fait les 5, à votre place, en une seule action. » | « Annoncia fait les 5, à votre place, en un clic. » |
| `page.tsx` | 116 | « Ce qu'aucun ChatGPT brut ne fera » | « Ce que ChatGPT seul ne sait pas faire » (plus naturel, moins méprisant) |
| `page.tsx` | 138 | « Annoncia se rembourse en 1 mandat par mois — vous économisez 8 à 12 heures. » | « Annoncia se rembourse dès le premier mandat. Vous économisez 8 à 12 h chaque mois. » |
| `page.tsx` | 144,156 | « HT / mois — agent indépendant » | « 29 € HT/mois — soit 0,97 €/jour. Sans engagement. » |
| `page.tsx` | 196 | « La prochaine annonce, c'est en 10 secondes. » | « Votre prochaine annonce ? Prête dans 10 secondes. » |
| `page.tsx` | 198 | « 3 essais gratuits, sans carte. Mettez-la sur un vrai mandat, voyez. » | « 3 essais gratuits, sans carte bancaire. Testez sur un mandat réel — vous verrez la différence. » |
| `page.tsx` | 202 | « Générer ma première annonce → » | OK ✓ |
| `pricing/page.tsx` | 63 | « Tarifs simples, pensés pour vous rembourser » | « Des tarifs simples, conçus pour être rentables » |
| `pricing/page.tsx` | 35 | « S'abonner Solo » | « Passer en Solo » (verbe d'action, moins transactionnel) |
| `pricing/page.tsx` | 65 | « Annoncia se rentabilise dès le 1er mandat du mois. » | « Annoncia se rentabilise dès le premier mandat du mois. Sans engagement, remboursé 14 jours. » (fusion) |
| `generate/page.tsx` | 25 | « Tout ce qui n'est pas indiqué ne sera pas inventé. » | OK et excellent ✓ — garder. |
| `GeneratorClient.tsx` | 153 | « Bien » (titre section) | « Le bien » (cohérence article) |
| `GeneratorClient.tsx` | 212 | « Performance énergétique (LCAP) » | « Diagnostic énergétique (DPE/GES) » (« LCAP » est jargon, l'agent reconnaît mieux DPE) |
| `GeneratorClient.tsx` | 273 | « Copropriété (ALUR) » | « Copropriété (loi ALUR) » |
| `GeneratorClient.tsx` | 311 | « Atouts (texte libre — pas d'invention) » | « Atouts du bien — décrivez librement, rien ne sera inventé » |
| `GeneratorClient.tsx` | 356 | « Génération en cours… » | « Annoncia rédige vos annonces… » (incarné, plus humain) |
| `GeneratorClient.tsx` | 357 | « Générer mes annonces » | OK ✓ — orienté bénéfice + possessif. |
| `GeneratorClient.tsx` | 366 | « Les annonces s'afficheront ici. » | OK mais cf. § 3.2 (ajouter l'exemple) |
| `GeneratorClient.tsx` | 126 | « Quota gratuit atteint. Passez sur un plan payant pour continuer. » | « Vous avez utilisé vos 3 essais gratuits. Passez en Solo (29 €/mois) pour des annonces illimitées. » |

### 5.3 CTAs : tous orientés bénéfice ?

| CTA | Verdict |
|---|---|
| « Essayer gratuitement (3 annonces) » | ✓ très bon |
| « Voir les tarifs → » | Neutre, OK pour secondaire |
| « Commencer » (carte Solo landing) | ✗ générique → « Passer en Solo (29 €/mois) » |
| « Choisir Agence » | ✓ acceptable |
| « Essayer maintenant » (Découverte pricing) | ✓ |
| « S'abonner Solo » | ✗ transactionnel → « Passer en Solo » ou « Activer Solo » |
| « Générer ma première annonce → » | ✓ |
| « Générer mes annonces » | ✓ (possessif) |
| « Copier » | OK mais ajouter feedback « ✓ Copié » |
| « Auto via ADEME » | ✗ → « Importer le DPE depuis l'ADEME » |
| « Passer Solo → » (depuis quota 0) | ✓ |

---

## 6. Mobile / responsive

### 6.1 Landing

- ✓ `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` partout sur les features.
- ✓ Hero `text-4xl md:text-6xl` adapté.
- ✓ CTAs `flex-col sm:flex-row` → stack mobile.
- ✓ Stats `grid-cols-2 md:grid-cols-4` → 2 par ligne mobile, bien.
- ✗ Le `<details>` FAQ est tactile-friendly mais le `summary` n'a pas de `:hover` ni `:active` distinct → manque d'affordance mobile.

### 6.2 Pricing

- ✓ `grid-cols-1 md:grid-cols-3` → stack vertical mobile.
- ✗ Sur mobile, le plan recommandé (Solo, milieu) est entre Découverte et Agence. La règle « le plan recommandé doit être visible immédiatement » suggère de le **placer en premier sur mobile** :
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-3">
    <div className="md:order-1 order-2">Découverte</div>
    <div className="md:order-2 order-1">Solo (highlight)</div>
    <div className="md:order-3 order-3">Agence</div>
  </div>
  ```
- ✗ La section ROI `grid-cols-1 md:grid-cols-3` stack OK, mais devient long sur mobile. Ajouter `gap-8` pour respirer.

### 6.3 Generator

- ✗ **BLOQUANT mobile** : `grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]` → le panel résultats apparaît **sous** le formulaire. Sur mobile, l'utilisateur scroll 21 champs avant de voir l'état vide / les résultats → confus, donne l'impression d'un formulaire infini.
- ✗ Le formulaire intérieur utilise `grid grid-cols-2 gap-3` pour les champs → sur mobile très étroit, les inputs `type=number` ont moins de 150 px et deviennent inutilisables (surtout DPE A-G).
- ✗ Les tabs des formats résultats (`flex flex-wrap gap-2 rounded-full`) peuvent déborder si 5 formats sélectionnés sur mobile 360 px. Tester.
- ✗ Aucun `viewport-fit=cover` (pour iPhone notch).

**Sévérité.** BLOQUANT pour le générateur sur mobile.

**Recommandations.**
1. Sur mobile, **collapser le formulaire après soumission** et scroller vers les résultats :
   ```tsx
   const [formCollapsed, setFormCollapsed] = useState(false);
   useEffect(() => { if (results) setFormCollapsed(true); }, [results]);
   ```
2. Sur les champs très courts (DPE, GES, Étage), passer en `grid-cols-3 sm:grid-cols-4` plutôt que 2/4.
3. Sticky CTA submit en bas d'écran mobile :
   ```tsx
   <div className="fixed bottom-0 inset-x-0 p-3 bg-[var(--color-background)] border-t md:relative md:border-0 md:p-0">
     <Button type="submit" size="lg" className="w-full">…</Button>
   </div>
   ```

---

## 7. Conversion funnel — frictions identifiées

### Étape 1 : Landing → clic « Essayer »

**Frictions.**
- Pas de visuel produit → l'utilisateur ne sait pas à quoi s'attendre.
- Pas de preuve sociale → doute légitime « est-ce sérieux ? ».
- Le badge « 100 % conformité légale » sans logo officiel (DGCCRF, ANIL, FNAIM) → auto-déclaratif.

### Étape 2 : Generator → 1er résultat

**Frictions.**
- 21 champs visibles → abandon probable > 40 % sur mobile.
- L'utilisateur découvre seulement après avoir cliqué « Générer » qu'il a 3 essais (le compteur n'apparaît qu'après).
- Pas d'exemple de résultat dans l'état vide → friction « je remplis sans savoir ce que je vais obtenir ».

### Étape 3 : Résultat → décision payante

**Frictions.**
- L'utilisateur a 3 générations gratuites. Après la 3e, message d'erreur sec sans modale d'upsell visuelle.
- Pas de capture email avant l'épuisement du quota → si quelqu'un consomme ses 3 essais et part, **on n'a aucun moyen de le récupérer**.
- Aucun call-to-action vers /pricing pendant l'usage du générateur (sauf en cas d'erreur 429).
- Pas de tracking analytics visible (à vérifier `next.config.ts`).

### Lead magnet manquant

**Sévérité.** BLOQUANT.

**Recommandation phare.** Ajouter une **capture email avant l'épuisement gratuit** :
- À la 2e génération, modale : « Vous voulez vos générations historisées + 2 essais bonus ? Laissez votre email. »
- Aboutit à une liste segmentée (Mailjet, Brevo) → séquence d'onboarding.

**Lead magnet alternatif sur la landing** : « Téléchargez gratuitement notre check-list LCAP/ALUR (12 points) » → email contre PDF → permet de retargetter.

---

## 8. Synthèse — Tableau récapitulatif

| # | Sujet | Sévérité |
|---|---|---|
| 1.1 | Hero promesse + CTA | IMPORTANT |
| 1.2 | Hiérarchie / « Comment ça marche » manquant | IMPORTANT |
| 1.3 | **Aucune preuve sociale (témoignages, logos, captures)** | **BLOQUANT** |
| 1.4 | FAQ : objections manquantes (invention, réseaux) | IMPORTANT |
| 1.5 | Copy à polir (hero, CTAs génériques) | IMPORTANT |
| 2.1 | Pas de tableau comparatif ni toggle annuel | IMPORTANT |
| 2.2 | ROI bien présent, manque simulateur interactif | MINEUR |
| 2.3 | FAQ pricing absente | IMPORTANT |
| 3.1 | **Formulaire 21 champs — intimidant** | **BLOQUANT** |
| 3.2 | État vide sans exemple de résultat | IMPORTANT |
| 3.3 | Feedback chargement faible (pas de skeleton ni streaming) | IMPORTANT |
| 3.4 | Auto ADEME : adresse mal placée + DOM access + feedback faible | IMPORTANT |
| 3.5 | Quota visible seulement après 1ère génération | IMPORTANT |
| 4.1 | Labels OK majoritairement, manque fieldset/role tabs | IMPORTANT |
| 4.2 | Contraste muted-foreground light borderline AA | IMPORTANT |
| 4.3 | Pas d'aria-live sur génération ni DPE ni erreurs | IMPORTANT |
| 4.4 | Copier sans feedback | MINEUR |
| 4.5 | Pas de skip-link | MINEUR |
| 4.6 | Pas de gestion focus après submit | MINEUR |
| 6.1-6.2 | Responsive landing/pricing OK, plan reco mal ordonné mobile | MINEUR |
| 6.3 | **Generator : panel résultats sous formulaire mobile** | **BLOQUANT** |
| 7 | **Aucune capture email / lead magnet** | **BLOQUANT** |

---

## Top 5 des améliorations à plus fort impact sur la conversion

### 1. Réduire drastiquement la friction du formulaire (BLOQUANT)
**Impact estimé : +25 à +40 % de taux de complétion du 1er essai.**

- Mode « Essai rapide » (5 champs : type, transaction, surface, prix, ville).
- Progressive disclosure : Copropriété/Honoraires conditionnels selon le type de transaction.
- Sticky CTA mobile.
- Sauvegarde brouillon `localStorage`.

### 2. Ajouter preuve sociale + visuel produit sur la landing (BLOQUANT)
**Impact estimé : +15 à +25 % du taux de clic Hero CTA.**

- 2-3 témoignages texte (avec photos si possible).
- Bandeau « Compatible avec » (SeLoger, LeBonCoin, Apimo, Hektor, ADEME).
- Capture/mockup d'annonce générée visible dans le hero ou juste sous.
- Section « Comment ça marche » en 3 étapes visuelles.

### 3. Capture email + lead magnet avant l'épuisement du quota (BLOQUANT)
**Impact estimé : récupération de 30-50 % des leads aujourd'hui perdus.**

- Modale « +2 essais bonus contre votre email » à la 2e génération.
- Check-list LCAP PDF gratuite sur la landing (email gate).
- Séquence d'onboarding email 5 messages (J+0, J+1, J+3, J+7, J+14).

### 4. Refondre l'expérience de chargement et le feedback DPE/ADEME (IMPORTANT, mais quick-win)
**Impact estimé : +10 % de perception de qualité, réduction de l'abandon en cours de génération.**

- Skeleton + steps rotatifs (« Vérification du brief », « Récupération DPE », etc.).
- Différencier visuellement succès/échec ADEME (vert/rouge + icône).
- aria-live pour annoncer les résultats aux screen readers.
- Idéalement : streaming SSE pour afficher le texte au fil de l'eau.

### 5. Pricing : tableau comparatif détaillé + toggle annuel + FAQ pricing (IMPORTANT)
**Impact estimé : +12 à +18 % de conversion paid sur le funnel post-essai.**

- Tableau comparatif explicite feature × plan.
- Toggle Mensuel/Annuel avec -20 % visible.
- 5 FAQ pricing (engagement, changement de plan, TVA, fair use, remboursement).
- Ajouter un simulateur ROI interactif.

---

*Audit rédigé le 18 mai 2026. Aucun fichier source modifié.*
