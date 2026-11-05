// Unsubscribe links for marketing email. Opting out is stored on WaitlistSubscriber (isActive
// false), which covers ticket buyers too: broadcasts skip any email marked inactive there.
import crypto from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

function getSecret() {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Set UNSUBSCRIBE_SECRET (or ADMIN_SESSION_SECRET) to sign unsubscribe links.");
  return secret;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Proves a link came from one of our emails, so nobody can opt other people in or out in bulk. */
export function getUnsubscribeToken(email: string) {
  return crypto.createHmac("sha256", getSecret()).update(normalizeEmail(email)).digest("base64url").slice(0, 32);
}

export function isValidUnsubscribeToken(email: string, token: string | null | undefined) {
  if (!token) return false;
  const expected = Buffer.from(getUnsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** Page link for the email footer. */
export function getUnsubscribeUrl(email: string) {
  const params = new URLSearchParams({ email: normalizeEmail(email), token: getUnsubscribeToken(email) });
  return `${getAppBaseUrl()}/unsubscribe?${params}`;
}

/** One-click link for the List-Unsubscribe header (Gmail and Yahoo show it as "Unsubscribe"). */
export function getOneClickUnsubscribeUrl(email: string) {
  const params = new URLSearchParams({ email: normalizeEmail(email), token: getUnsubscribeToken(email) });
  return `${getAppBaseUrl()}/api/unsubscribe?${params}`;
}

export async function isUnsubscribed(email: string) {
  const subscriber = await prisma.waitlistSubscriber.findUnique({
    where: { email: normalizeEmail(email) },
    select: { isActive: true },
  });
  return subscriber ? !subscriber.isActive : false;
}

export async function setSubscribed(email: string, subscribed: boolean) {
  const normalized = normalizeEmail(email);
  await prisma.waitlistSubscriber.upsert({
    where: { email: normalized },
    update: { isActive: subscribed },
    // A ticket buyer who never joined the list still needs a row to remember the opt-out.
    create: { email: normalized, source: subscribed ? "RESUBSCRIBE" : "UNSUBSCRIBE", isActive: subscribed },
  });
  await syncResendContact(normalized, subscribed);
}

// Keep Resend in step, so people who opt out here also stop getting Resend broadcasts.
async function syncResendContact(email: string, subscribed: boolean) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const response = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ unsubscribed: !subscribed }),
    });
    // 404 just means they were never imported into Resend.
    if (!response.ok && response.status !== 404) {
      console.error(`Resend contact update failed for ${email}: ${response.status} ${await response.text()}`);
    }
  } catch (error) {
    console.error(`Resend contact update failed for ${email}`, error);
  }
}
