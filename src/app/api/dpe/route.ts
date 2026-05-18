import { NextResponse } from "next/server";
import { searchDpeByAddress } from "@/lib/dpe";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address")?.trim();
  const postalCode = url.searchParams.get("postal_code")?.trim() ?? undefined;

  if (!address || address.length < 4) {
    return NextResponse.json({ error: "address requis (>= 4 caractères)" }, { status: 400 });
  }

  try {
    const records = await searchDpeByAddress(address, postalCode);
    return NextResponse.json({ records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur ADEME";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
