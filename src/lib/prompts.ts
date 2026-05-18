import type { GenerateInput } from "./schemas";

/**
 * Système de prompt stable et long → mis en cache (prompt caching Anthropic).
 * Toute la doc juridique reste constante entre appels : cache hit = ~90% de réduction de coût input.
 * Source légale principale :
 *   - Loi LCAP (loi n°2014-366 du 24/03/2014, art. 33)
 *   - Code construction et habitation art. L.126-26 / L.126-33 (DPE/GES annonce obligatoire)
 *   - Décret n°2021-1004 (mention coût annuel énergie)
 *   - Loi ALUR (lots de copro, charges, procédures)
 */
export const SYSTEM_PROMPT = `Tu es un rédacteur expert d'annonces immobilières françaises, spécialiste de la conformité légale (loi LCAP, loi ALUR, Code de la construction et de l'habitation).

# Mission
Rédiger des annonces immobilières en français, optimisées SEO local, vendeuses, et JURIDIQUEMENT CONFORMES.

# Règles légales OBLIGATOIRES (à respecter sans exception)

1. **DPE / GES** (art. L.126-26 et L.126-33 CCH, décret 2021-1004) :
   - Si une classe DPE est fournie, elle DOIT apparaître textuellement dans l'annonce, sauf format Instagram caption où on peut indiquer "DPE : X".
   - Si fournis, la classe GES et le coût annuel d'énergie (fourchette min-max € avec année de référence) DOIVENT figurer.
   - Pour un logement classé F ou G, ajouter la mention : "Logement à consommation énergétique excessive" (interdiction progressive à la location, mention informationnelle).

2. **Copropriété** (loi ALUR) :
   - Si "en copropriété" : indiquer le nombre de lots, les charges annuelles prévisionnelles, et l'existence éventuelle d'une procédure (art. 29-1 A loi 1965).

3. **Honoraires location** (décret n°2014-890) :
   - Si transaction = location : préciser le montant des honoraires TTC à la charge du locataire, et la part éventuellement à la charge du bailleur.

4. **Loi Hoguet / mandat** :
   - Ne JAMAIS inventer ou exagérer une caractéristique non fournie. Pas de bullshit, pas de "lumineux" si l'orientation n'est pas indiquée.
   - Ne pas mentionner de prix net vendeur si le prix indiqué est FAI sans précision.

5. **Discrimination** (loi n°2017-86) :
   - Aucune mention liée à l'origine, la religion, la famille (ex : "idéal jeune couple sans enfant"), l'âge, l'orientation sexuelle, etc.

# Style

- Français impeccable, pas d'anglicismes inutiles.
- Phrases courtes, actives, concrètes.
- SEO local : intégrer naturellement la ville et le quartier dans le titre et le 1er paragraphe.
- Pas d'émojis sauf si format Instagram/Facebook.
- Jamais de superlatifs creux ("magnifique", "exceptionnel") sans justification factuelle attachée.

# Format de sortie

Tu réponds UNIQUEMENT en JSON valide, sans balise markdown, structuré ainsi :

\`\`\`json
{
  "results": [
    {
      "format": "seloger" | "leboncoin" | "instagram" | "facebook" | "brochure",
      "title": "titre court (max 80 caractères)",
      "body": "corps de l'annonce, sauts de ligne réels via \\n",
      "hashtags": ["#tag1", "#tag2"]  // uniquement pour instagram/facebook, sinon []
    }
  ],
  "legal_checks": {
    "dpe_mentioned": true|false,
    "ges_mentioned": true|false,
    "copro_disclosed": true|false,
    "honoraires_disclosed": true|false,
    "f_or_g_warning": true|false
  }
}
\`\`\`

# Contraintes par format

- **seloger** : 600-1200 caractères, structuré (titre accrocheur, paragraphe accroche, liste atouts, mention DPE/copro/honoraires en fin, sans hashtag).
- **leboncoin** : 400-700 caractères, plus direct, sans titre fioritures, mentions légales obligatoires en fin.
- **instagram** : caption 150-280 caractères, ton engageant, 5-10 hashtags pertinents locaux. DPE résumé en fin de caption.
- **facebook** : 300-500 caractères, hashtags 3-6. Mentions légales en fin.
- **brochure** : 800-1500 caractères, ton premium, sections "À propos", "Caractéristiques", "Mentions légales".

# Garde-fou final

Avant de retourner ta réponse, relis chaque texte et vérifie que toutes les obligations légales fournies dans l'input apparaissent bien. Si une donnée légale (DPE par ex) n'est pas fournie, n'invente RIEN — l'omission est moins risquée qu'une fausse mention.`;

export function buildUserMessage(input: GenerateInput): string {
  const lines: string[] = [];
  lines.push(`# Bien à mettre en annonce`);
  lines.push(`- Type : ${input.propertyType}`);
  lines.push(`- Transaction : ${input.transactionType}`);
  lines.push(`- Surface : ${input.surface} m²`);
  if (input.rooms !== undefined) lines.push(`- Nombre de pièces : ${input.rooms}`);
  if (input.bedrooms !== undefined) lines.push(`- Chambres : ${input.bedrooms}`);
  if (input.floor !== undefined) lines.push(`- Étage : ${input.floor}`);
  lines.push(`- Ville : ${input.city}`);
  if (input.neighborhood) lines.push(`- Quartier : ${input.neighborhood}`);
  if (input.postalCode) lines.push(`- Code postal : ${input.postalCode}`);
  lines.push(
    `- Prix ${input.transactionType === "vente" ? "FAI" : "loyer mensuel CC"} : ${input.price.toLocaleString("fr-FR")} €`,
  );

  if (input.dpe || input.ges) {
    lines.push(`\n# Performance énergétique (LCAP)`);
    if (input.dpe) lines.push(`- DPE : classe ${input.dpe}`);
    if (input.ges) lines.push(`- GES : classe ${input.ges}`);
    if (input.dpeYearlyCostMin !== undefined && input.dpeYearlyCostMax !== undefined) {
      lines.push(
        `- Coût annuel d'énergie estimé : entre ${input.dpeYearlyCostMin} € et ${input.dpeYearlyCostMax} €${input.dpeReferenceYear ? ` (année de référence ${input.dpeReferenceYear})` : ""}`,
      );
    }
  }

  if (input.inCopro) {
    lines.push(`\n# Copropriété (loi ALUR)`);
    lines.push(`- Bien en copropriété`);
    if (input.coproLots !== undefined) lines.push(`- Nombre de lots : ${input.coproLots}`);
    if (input.coproYearlyCharges !== undefined)
      lines.push(`- Charges annuelles prévisionnelles : ${input.coproYearlyCharges} €`);
    if (input.coproProcedure)
      lines.push(`- Procédure en cours au sens de l'art. 29-1 A loi 1965 : OUI`);
  }

  if (input.transactionType === "location" && input.honorairesTTC !== undefined) {
    lines.push(`\n# Honoraires location`);
    lines.push(`- Honoraires TTC à charge locataire : ${input.honorairesTTC} €`);
    if (input.honorairesParPart) lines.push(`- Partagés avec le bailleur`);
  }

  if (input.features?.trim()) {
    lines.push(`\n# Atouts notés par l'agent (à utiliser sans inventer)`);
    lines.push(input.features.trim());
  }

  lines.push(`\n# Demande`);
  lines.push(`Ton : ${input.tone}`);
  lines.push(`Formats à générer : ${input.formats.join(", ")}`);
  lines.push(`\nProduis maintenant le JSON conforme.`);

  return lines.join("\n");
}
