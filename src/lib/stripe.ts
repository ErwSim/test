import Stripe from "stripe";

let _client: Stripe | null = null;

export function stripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquante (cf. .env.example)");
  }
  _client = new Stripe(key, { typescript: true });
  return _client;
}

export const PRICE_IDS = {
  solo: () => process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO,
  agency: () => process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY,
} as const;

export type Plan = "solo" | "agency";

export function planFromPriceId(priceId: string | null | undefined): "solo" | "agency" | null {
  if (!priceId) return null;
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO) return "solo";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY) return "agency";
  return null;
}
