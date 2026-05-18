"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";

type Format = "seloger" | "leboncoin" | "instagram" | "facebook" | "brochure";

interface GenerationResult {
  format: string;
  title: string;
  body: string;
  hashtags: string[];
}
interface LegalChecks {
  dpe_mentioned: boolean;
  ges_mentioned: boolean;
  copro_disclosed: boolean;
  honoraires_disclosed: boolean;
  f_or_g_warning: boolean;
}

const FORMAT_LABELS: Record<Format, string> = {
  seloger: "SeLoger",
  leboncoin: "LeBonCoin",
  instagram: "Instagram",
  facebook: "Facebook",
  brochure: "Brochure PDF",
};

export default function GeneratorClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [legalChecks, setLegalChecks] = useState<LegalChecks | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [remaining, setRemaining] = useState<number | null>(null);

  const [formats, setFormats] = useState<Format[]>(["seloger", "leboncoin", "instagram"]);
  const [dpeLookupLoading, setDpeLookupLoading] = useState(false);
  const [dpeLookupMsg, setDpeLookupMsg] = useState<string | null>(null);

  async function tryDpeLookup(address: string, postalCode: string) {
    if (!address.trim()) {
      setDpeLookupMsg("Saisissez l'adresse pour rechercher le DPE");
      return;
    }
    setDpeLookupLoading(true);
    setDpeLookupMsg(null);
    try {
      const url = `/api/dpe?address=${encodeURIComponent(address)}${
        postalCode ? `&postal_code=${encodeURIComponent(postalCode)}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur ADEME");
      const record = data.records?.[0];
      if (!record) {
        setDpeLookupMsg("Aucun DPE trouvé pour cette adresse — saisissez-le manuellement.");
        return;
      }
      const dpeEl = document.getElementById("dpe") as HTMLSelectElement | null;
      const gesEl = document.getElementById("ges") as HTMLSelectElement | null;
      const minEl = document.getElementById("dpeYearlyCostMin") as HTMLInputElement | null;
      const maxEl = document.getElementById("dpeYearlyCostMax") as HTMLInputElement | null;
      if (dpeEl && record.classe_dpe) dpeEl.value = record.classe_dpe;
      if (gesEl && record.classe_ges) gesEl.value = record.classe_ges;
      if (minEl && record.cout_total_5_usages_min)
        minEl.value = String(record.cout_total_5_usages_min);
      if (maxEl && record.cout_total_5_usages_max)
        maxEl.value = String(record.cout_total_5_usages_max);
      setDpeLookupMsg(
        `DPE ${record.classe_dpe ?? "?"} / GES ${record.classe_ges ?? "?"} importé depuis l'ADEME.`,
      );
    } catch (e) {
      setDpeLookupMsg(e instanceof Error ? e.message : "Erreur DPE");
    } finally {
      setDpeLookupLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setLegalChecks(null);

    const fd = new FormData(event.currentTarget);
    const body = {
      propertyType: fd.get("propertyType") as string,
      transactionType: fd.get("transactionType") as string,
      surface: Number(fd.get("surface")),
      rooms: numberOrUndef(fd.get("rooms")),
      bedrooms: numberOrUndef(fd.get("bedrooms")),
      floor: numberOrUndef(fd.get("floor")),
      city: (fd.get("city") as string)?.trim(),
      neighborhood: optionalString(fd.get("neighborhood")),
      postalCode: optionalString(fd.get("postalCode")),
      price: Number(fd.get("price")),
      dpe: optionalString(fd.get("dpe")),
      ges: optionalString(fd.get("ges")),
      dpeYearlyCostMin: numberOrUndef(fd.get("dpeYearlyCostMin")),
      dpeYearlyCostMax: numberOrUndef(fd.get("dpeYearlyCostMax")),
      dpeReferenceYear: numberOrUndef(fd.get("dpeReferenceYear")),
      inCopro: fd.get("inCopro") === "on",
      coproLots: numberOrUndef(fd.get("coproLots")),
      coproYearlyCharges: numberOrUndef(fd.get("coproYearlyCharges")),
      coproProcedure: fd.get("coproProcedure") === "on",
      honorairesTTC: numberOrUndef(fd.get("honorairesTTC")),
      honorairesParPart: fd.get("honorairesParPart") === "on",
      features: (fd.get("features") as string) ?? "",
      tone: fd.get("tone") as string,
      formats,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError("Quota gratuit atteint. Passez sur un plan payant pour continuer.");
          return;
        }
        throw new Error(data.error ?? "Erreur");
      }
      setResults(data.results);
      setLegalChecks(data.legal_checks);
      setRemaining(typeof data.remaining === "number" ? data.remaining : null);
      setActiveTab(data.results?.[0]?.format ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function toggleFormat(f: Format) {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-[var(--color-border)] p-6"
      >
        <section>
          <h2 className="mb-4 font-semibold">Bien</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="propertyType">Type</Label>
              <Select id="propertyType" name="propertyType" defaultValue="appartement">
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="loft">Loft</option>
                <option value="terrain">Terrain</option>
                <option value="local-commercial">Local commercial</option>
                <option value="immeuble">Immeuble</option>
                <option value="parking">Parking</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionType">Transaction</Label>
              <Select id="transactionType" name="transactionType" defaultValue="vente">
                <option value="vente">Vente</option>
                <option value="location">Location</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input id="surface" name="surface" type="number" min="1" required />
            </div>
            <div>
              <Label htmlFor="price">Prix (€)</Label>
              <Input id="price" name="price" type="number" min="1" required />
            </div>
            <div>
              <Label htmlFor="rooms">Pièces</Label>
              <Input id="rooms" name="rooms" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="bedrooms">Chambres</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="floor">Étage</Label>
              <Input id="floor" name="floor" type="number" />
            </div>
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input id="city" name="city" required placeholder="Bordeaux" />
            </div>
            <div>
              <Label htmlFor="neighborhood">Quartier</Label>
              <Input id="neighborhood" name="neighborhood" placeholder="Caudéran" />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal</Label>
              <Input id="postalCode" name="postalCode" pattern="\d{5}" placeholder="33000" />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Performance énergétique (LCAP)</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={dpeLookupLoading}
              onClick={() => {
                const addr = (document.getElementById("neighborhood") as HTMLInputElement)?.value;
                const city = (document.getElementById("city") as HTMLInputElement)?.value ?? "";
                const cp = (document.getElementById("postalCode") as HTMLInputElement)?.value ?? "";
                void tryDpeLookup(`${addr ?? ""} ${city}`.trim(), cp);
              }}
            >
              {dpeLookupLoading ? "Recherche…" : "Auto via ADEME"}
            </Button>
          </div>
          {dpeLookupMsg ? (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{dpeLookupMsg}</p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="dpe">DPE</Label>
              <Select id="dpe" name="dpe" defaultValue="">
                <option value="">—</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="ges">GES</Label>
              <Select id="ges" name="ges" defaultValue="">
                <option value="">—</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dpeYearlyCostMin">Coût min (€/an)</Label>
              <Input id="dpeYearlyCostMin" name="dpeYearlyCostMin" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="dpeYearlyCostMax">Coût max (€/an)</Label>
              <Input id="dpeYearlyCostMax" name="dpeYearlyCostMax" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="dpeReferenceYear">Année réf.</Label>
              <Input
                id="dpeReferenceYear"
                name="dpeReferenceYear"
                type="number"
                min="2000"
                max="2100"
                placeholder="2024"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">Copropriété (ALUR)</h2>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" id="inCopro" name="inCopro" />
            Bien en copropriété
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="coproLots">Nombre de lots</Label>
              <Input id="coproLots" name="coproLots" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="coproYearlyCharges">Charges/an (€)</Label>
              <Input id="coproYearlyCharges" name="coproYearlyCharges" type="number" min="0" />
            </div>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" id="coproProcedure" name="coproProcedure" />
            Procédure en cours (art. 29-1 A loi 1965)
          </label>
        </section>

        <section>
          <h2 className="font-semibold">Honoraires (location)</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="honorairesTTC">Honoraires TTC locataire (€)</Label>
              <Input id="honorairesTTC" name="honorairesTTC" type="number" min="0" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="honorairesParPart" />
                Partagés bailleur
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">Atouts (texte libre — pas d'invention)</h2>
          <Textarea
            name="features"
            rows={4}
            className="mt-3"
            placeholder={"Exemple :\n- Cuisine équipée 2022\n- Balcon sud 6 m²\n- Proche tram ligne C (5 min)\n- Cave"}
          />
        </section>

        <section>
          <h2 className="font-semibold">Style & formats</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tone">Ton</Label>
              <Select id="tone" name="tone" defaultValue="factuel">
                <option value="chaleureux">Chaleureux</option>
                <option value="factuel">Factuel</option>
                <option value="premium">Premium</option>
                <option value="familial">Familial</option>
                <option value="investisseur">Investisseur</option>
              </Select>
            </div>
            <div>
              <Label>Formats</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => toggleFormat(f)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      formats.includes(f)
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={loading || formats.length === 0}>
          {loading ? "Génération en cours…" : "Générer mes annonces"}
        </Button>
        {error ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-[var(--color-danger)]">{error}</p>
        ) : null}
      </form>

      <div className="space-y-4">
        {!results ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
            Les annonces s'afficheront ici.
            <br />
            Astuce : essayez d'abord avec un seul format pour itérer plus vite.
          </div>
        ) : (
          <>
            {legalChecks ? (
              <div className="rounded-xl border border-[var(--color-border)] p-4">
                <p className="text-sm font-semibold">Conformité légale</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge ok={legalChecks.dpe_mentioned} label="DPE" />
                  <Badge ok={legalChecks.ges_mentioned} label="GES" />
                  <Badge ok={legalChecks.copro_disclosed} label="Copro" />
                  <Badge ok={legalChecks.honoraires_disclosed} label="Honoraires" />
                  {legalChecks.f_or_g_warning ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-900">
                      Mention F/G ajoutée
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {results.map((r) => (
                <button
                  key={r.format}
                  type="button"
                  onClick={() => setActiveTab(r.format)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    activeTab === r.format
                      ? "border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-background)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {FORMAT_LABELS[r.format as Format] ?? r.format}
                </button>
              ))}
            </div>

            {results
              .filter((r) => r.format === activeTab)
              .map((r) => (
                <div key={r.format} className="rounded-2xl border border-[var(--color-border)] p-4">
                  {r.title ? <h3 className="text-lg font-semibold">{r.title}</h3> : null}
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-sm">{r.body}</pre>
                  {r.hashtags && r.hashtags.length > 0 ? (
                    <p className="mt-3 text-sm text-[var(--color-accent)]">
                      {r.hashtags.join(" ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const text = `${r.title ? r.title + "\n\n" : ""}${r.body}${
                          r.hashtags?.length ? "\n\n" + r.hashtags.join(" ") : ""
                        }`;
                        void navigator.clipboard.writeText(text);
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              ))}

            {remaining !== null ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Quota gratuit restant : <strong>{remaining}</strong>{" "}
                {remaining === 0 ? (
                  <a href="/pricing" className="underline">
                    Passer Solo →
                  </a>
                ) : null}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${
        ok ? "bg-green-100 text-green-900" : "bg-zinc-200 text-zinc-700"
      }`}
    >
      {ok ? "✓" : "—"} {label}
    </span>
  );
}

function numberOrUndef(v: FormDataEntryValue | null): number | undefined {
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function optionalString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}
