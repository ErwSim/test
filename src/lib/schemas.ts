import { z } from "zod";

export const dpeClass = z.enum(["A", "B", "C", "D", "E", "F", "G"]);
export const propertyType = z.enum([
  "appartement",
  "maison",
  "studio",
  "loft",
  "terrain",
  "local-commercial",
  "immeuble",
  "parking",
]);

export const transactionType = z.enum(["vente", "location"]);

export const generateInputSchema = z.object({
  propertyType,
  transactionType,
  surface: z.number().int().positive().max(100000),
  rooms: z.number().int().min(0).max(50).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  floor: z.number().int().min(-5).max(200).optional(),
  city: z.string().min(1).max(120),
  neighborhood: z.string().max(120).optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal invalide")
    .optional(),
  price: z.number().positive().max(1_000_000_000),

  // Performance énergétique (obligatoire pour annonce LCAP depuis 01/07/2021)
  dpe: dpeClass.optional(),
  ges: dpeClass.optional(),
  dpeYearlyCostMin: z.number().int().min(0).optional(),
  dpeYearlyCostMax: z.number().int().min(0).optional(),
  dpeReferenceYear: z.number().int().min(2000).max(2100).optional(),

  // Copropriété (loi ALUR + LCAP)
  inCopro: z.boolean().optional(),
  coproLots: z.number().int().min(0).max(100000).optional(),
  coproYearlyCharges: z.number().int().min(0).optional(),
  coproProcedure: z.boolean().optional(),

  // Honoraires (location)
  honorairesTTC: z.number().min(0).optional(),
  honorairesParPart: z.boolean().optional(),

  // Atouts libres listés par l'agent
  features: z.string().max(2000).default(""),

  tone: z.enum(["chaleureux", "factuel", "premium", "familial", "investisseur"]).default("factuel"),
  formats: z
    .array(z.enum(["seloger", "leboncoin", "instagram", "facebook", "brochure"]))
    .min(1)
    .max(5),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
