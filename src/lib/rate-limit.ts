/**
 * Rate limiter en mémoire pour MVP.
 * Quota par IP : empêche l'abus du quota gratuit (3 générations/IP/jour par défaut).
 *
 * Limitation connue : ne survit pas à un redémarrage et n'est pas partagé entre instances.
 * → À remplacer par Upstash Redis dès la prod sérieuse (cf. README "Pour la prod").
 */

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function checkQuota(key: string, limit: number): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const fresh: Counter = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
