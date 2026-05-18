import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, PRICE_IDS, type Plan } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  plan: z.enum(["solo", "agency"]),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const plan: Plan = parsed.data.plan;
  const priceId = PRICE_IDS[plan]();
  if (!priceId) {
    return NextResponse.json(
      { error: "Plan non configuré côté serveur" },
      { status: 503 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    // DB indisponible : flow d'inscription via email à la fin du checkout
    user = null;
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user?.email ?? parsed.data.email,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 0,
        metadata: {
          plan,
          org_id: user?.orgId ?? "",
          user_id: user?.id ?? "",
        },
      },
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Création de la session de paiement impossible" },
      { status: 500 },
    );
  }
}
