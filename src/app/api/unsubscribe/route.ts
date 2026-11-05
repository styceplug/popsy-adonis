import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isValidUnsubscribeToken, setSubscribed } from "@/lib/unsubscribe";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email(),
  token: z.string().optional(),
  action: z.enum(["unsubscribe", "resubscribe"]).default("unsubscribe"),
});

/**
 * Two callers:
 * - Mail apps' one-click "Unsubscribe" button (RFC 8058): a form POST with email and token in
 *   the URL. Needs a valid token, since it acts without asking.
 * - The /unsubscribe page: JSON. Unsubscribing works with just the email, so links in Resend
 *   templates (which can't sign) still work; resubscribing needs the token from our own emails.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const email = request.nextUrl.searchParams.get("email") ?? "";
    const token = request.nextUrl.searchParams.get("token");
    if (!email || !isValidUnsubscribeToken(email, token)) {
      return NextResponse.json({ message: "This unsubscribe link is not valid." }, { status: 400 });
    }
    await setSubscribed(email, false);
    return NextResponse.json({ ok: true });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  const { email, token, action } = parsed.data;
  if (action === "resubscribe" && !isValidUnsubscribeToken(email, token)) {
    return NextResponse.json(
      { message: "Use the link in one of our emails to join again, or sign up on the site." },
      { status: 403 },
    );
  }

  await setSubscribed(email, action === "resubscribe");
  return NextResponse.json({ ok: true, subscribed: action === "resubscribe" });
}
