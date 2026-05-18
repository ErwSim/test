import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, schema } from "./db";

const SESSION_COOKIE = "annoncia_session";
const SESSION_DURATION_DAYS = 30;
const MAGIC_LINK_DURATION_MIN = 15;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  role: string;
  plan: "free" | "solo" | "agency";
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createMagicLink(email: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_DURATION_MIN * 60_000);
  await db().insert(schema.magicLinks).values({
    email: email.toLowerCase().trim(),
    tokenHash,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function consumeMagicLink(token: string): Promise<AuthUser | null> {
  const tokenHash = hash(token);
  const [link] = await db()
    .select()
    .from(schema.magicLinks)
    .where(
      and(
        eq(schema.magicLinks.tokenHash, tokenHash),
        isNull(schema.magicLinks.consumedAt),
        gt(schema.magicLinks.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!link) return null;

  await db()
    .update(schema.magicLinks)
    .set({ consumedAt: new Date() })
    .where(eq(schema.magicLinks.id, link.id));

  return ensureUser(link.email);
}

async function ensureUser(email: string): Promise<AuthUser> {
  const normalized = email.toLowerCase().trim();
  const [existing] = await db()
    .select({
      userId: schema.users.id,
      orgId: schema.users.orgId,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      plan: schema.orgs.plan,
    })
    .from(schema.users)
    .innerJoin(schema.orgs, eq(schema.users.orgId, schema.orgs.id))
    .where(eq(schema.users.email, normalized))
    .limit(1);

  if (existing) {
    return {
      id: existing.userId,
      email: existing.email,
      name: existing.name,
      orgId: existing.orgId,
      role: existing.role,
      plan: existing.plan,
    };
  }

  const [org] = await db()
    .insert(schema.orgs)
    .values({ name: normalized.split("@")[0] ?? "Mon agence" })
    .returning();

  const [user] = await db()
    .insert(schema.users)
    .values({
      orgId: org.id,
      email: normalized,
      role: "owner",
      emailVerifiedAt: new Date(),
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    orgId: org.id,
    role: user.role,
    plan: org.plan,
  };
}

export async function startSession(
  userId: string,
  meta: { userAgent?: string; ipHash?: string } = {},
): Promise<void> {
  const token = randomToken();
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86_400_000);

  await db().insert(schema.sessions).values({
    userId,
    tokenHash,
    userAgent: meta.userAgent?.slice(0, 500),
    ipHash: meta.ipHash,
    expiresAt,
  });

  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hash(token);
    await db().delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
  }
  c.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hash(token);
  const [row] = await db()
    .select({
      userId: schema.users.id,
      orgId: schema.users.orgId,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      plan: schema.orgs.plan,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .innerJoin(schema.orgs, eq(schema.orgs.id, schema.users.orgId))
    .where(eq(schema.sessions.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt < new Date()) return null;

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
    orgId: row.orgId,
    role: row.role,
    plan: row.plan,
  };
}

export function hashIp(ip: string): string {
  return hash(`${ip}|${process.env.IP_HASH_SALT ?? "annoncia-dev-salt"}`).slice(0, 16);
}
