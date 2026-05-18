import { NextResponse } from "next/server";
import { generateInputSchema } from "@/lib/schemas";
import { generateAnnonces } from "@/lib/anthropic";
import { checkQuota, extractClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_QUOTA = Number(process.env.FREE_QUOTA_PER_IP ?? 3);

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = generateInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ip = extractClientIp(req);
  const quota = checkQuota(`gen:${ip}`, FREE_QUOTA);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "Quota gratuit atteint",
        remaining: 0,
        resetAt: quota.resetAt,
        upgradeUrl: "/pricing",
      },
      { status: 429 },
    );
  }

  try {
    const result = await generateAnnonces(parsed.data);
    return NextResponse.json({
      results: result.parsed.results,
      legal_checks: result.parsed.legal_checks,
      usage: result.usage,
      remaining: quota.remaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[generate] error:", message);
    return NextResponse.json(
      { error: "Génération impossible", detail: message },
      { status: 500 },
    );
  }
}
