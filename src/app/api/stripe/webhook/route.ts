import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe non configuré" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // TODO branchement DB : enregistrer le client + abonnement actif.
      // L'objet event.data.object contient customer, subscription, metadata.
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      // TODO branchement DB : mettre à jour le statut d'abonnement.
      break;
    }
    default:
      // Événement non traité, mais accusé réception.
      break;
  }

  return NextResponse.json({ received: true });
}
