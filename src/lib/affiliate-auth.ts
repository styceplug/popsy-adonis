import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const affiliateCookieName = "popsy-affiliate-session";
export const affiliateRefCookieName = "popsy-ref";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type AffiliateSession = {
  affiliateId: string;
  exp: number;
};

function getSessionSecret() {
  const secret =
    process.env.AFFILIATE_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("AFFILIATE_SESSION_SECRET is not configured.");
  }

  return secret;
}

// The "affiliate." prefix keeps these signatures from ever validating as admin sessions.
function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(`affiliate.${encodedPayload}`).digest("base64url");
}

export function createAffiliateSessionToken(affiliateId: string) {
  const payload: AffiliateSession = {
    affiliateId,
    exp: Date.now() + sessionMaxAgeSeconds * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyAffiliateSessionToken(token?: string) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(signPayload(encodedPayload));

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AffiliateSession;
    if (!session.affiliateId || !session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);

  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Readable, unambiguous codes: a slice of the name plus four random characters. */
export async function generateAffiliateCode(fullName: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = fullName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "PA";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Array.from(crypto.randomBytes(4), (byte) => alphabet[byte % alphabet.length]).join("");
    const code = `${prefix}${suffix}`;
    const existing = await prisma.affiliate.findUnique({ where: { code }, select: { id: true } });
    if (!existing) return code;
  }

  return `PA${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function getCurrentAffiliate() {
  const cookieStore = await cookies();
  const session = verifyAffiliateSessionToken(cookieStore.get(affiliateCookieName)?.value);
  if (!session) return null;

  return prisma.affiliate.findUnique({ where: { id: session.affiliateId } });
}

export async function requireAffiliate() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/affiliate/login");
  return affiliate;
}

export async function getAffiliateFromRequest(request: NextRequest) {
  const session = verifyAffiliateSessionToken(request.cookies.get(affiliateCookieName)?.value);
  if (!session) return null;

  return prisma.affiliate.findUnique({ where: { id: session.affiliateId } });
}

export function setAffiliateSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(affiliateCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
}

export function clearAffiliateSessionCookie(response: NextResponse) {
  response.cookies.set(affiliateCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
