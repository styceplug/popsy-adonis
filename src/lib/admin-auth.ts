import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";

export type AdminSession = {
  name: string;
  exp: number;
};

export const adminCookieName = "popsy-admin-session";
const sessionMaxAgeSeconds = 60 * 60 * 12;

function getAdminPassword() {
  return process.env.ADMIN_ACCESS_PASSWORD ?? "Popsysummerparty";
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.PAYSTACK_SECRET_KEY ?? "popsy-adonis-local-admin-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return crypto.createHmac("sha256", getAdminSessionSecret()).update(encodedPayload).digest("base64url");
}

export function createAdminSessionToken(name: string) {
  const payload: AdminSession = {
    name: name.trim(),
    exp: Date.now() + sessionMaxAgeSeconds * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSession;
    if (!session.name || !session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function isValidAdminLogin(name: string, password: string) {
  return name.trim().length >= 2 && password === getAdminPassword();
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(adminCookieName)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(adminCookieName)?.value);
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
