/**
 * Recherche du DPE via l'API publique ADEME (Open Data Énergie).
 * Doc : https://data.ademe.fr/datasets/dpe03existant
 *
 * Stratégie : on cherche par numéro DPE OU par adresse normalisée.
 * Si plusieurs résultats, on retourne le plus récent.
 */

export interface DpeRecord {
  numero_dpe: string;
  classe_dpe: string;
  classe_ges: string | null;
  cout_total_5_usages_min: number | null;
  cout_total_5_usages_max: number | null;
  annee_construction: number | null;
  surface: number | null;
  date_etablissement: string | null;
  adresse: string | null;
}

const ADEME_ENDPOINT =
  "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";

export async function searchDpeByAddress(
  address: string,
  postalCode?: string,
): Promise<DpeRecord[]> {
  const q = postalCode ? `${address} ${postalCode}` : address;
  const url = new URL(ADEME_ENDPOINT);
  url.searchParams.set("q", q);
  url.searchParams.set("size", "5");
  url.searchParams.set("sort", "-date_etablissement_dpe");
  url.searchParams.set(
    "select",
    [
      "n_dpe",
      "etiquette_dpe",
      "etiquette_ges",
      "cout_total_5_usages_energie_n",
      "annee_construction",
      "surface_habitable_logement",
      "date_etablissement_dpe",
      "adresse_brut",
    ].join(","),
  );

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`ADEME API ${res.status}`);
  }

  const data = (await res.json()) as { results?: Record<string, unknown>[] };
  if (!data.results) return [];

  return data.results.map((r) => ({
    numero_dpe: String(r.n_dpe ?? ""),
    classe_dpe: String(r.etiquette_dpe ?? ""),
    classe_ges: r.etiquette_ges ? String(r.etiquette_ges) : null,
    cout_total_5_usages_min:
      typeof r.cout_total_5_usages_energie_n === "number"
        ? Math.round(r.cout_total_5_usages_energie_n * 0.85)
        : null,
    cout_total_5_usages_max:
      typeof r.cout_total_5_usages_energie_n === "number"
        ? Math.round(r.cout_total_5_usages_energie_n * 1.15)
        : null,
    annee_construction:
      typeof r.annee_construction === "number" ? r.annee_construction : null,
    surface:
      typeof r.surface_habitable_logement === "number"
        ? r.surface_habitable_logement
        : null,
    date_etablissement: r.date_etablissement_dpe
      ? String(r.date_etablissement_dpe)
      : null,
    adresse: r.adresse_brut ? String(r.adresse_brut) : null,
  }));
}
