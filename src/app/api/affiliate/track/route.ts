import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { affiliateRefCookieName } from "@/lib/affiliate-auth";
import { AFFILIATE_REF_COOKIE_DAYS } from "@/lib/affiliates";
import { prisma } from "@/lib/prisma";

const trackSchema = z.object({
  code: z.string().trim().min(3).max(40),
  eventSlug: z.string().trim().max(200).optional(),
});

/** Records a click on an affiliate link and remembers the affiliate for checkout. */
export async function POST(request: NextRequest) {
  const parsed = trackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ tracked: false });

  const affiliate = await prisma.affiliate.findUnique({
    where: { code: parsed.data.code.toUpperCase() },
    select: { id: true, code: true, status: true },
  });

  if (!affiliate || affiliate.status !== "APPROVED") {
    return NextResponse.json({ tracked: false });
  }

  if (parsed.data.eventSlug) {
    const event = await prisma.event.findUnique({ where: { slug: parsed.data.eventSlug }, select: { id: true } });

    if (event) {
      await prisma.affiliateLinkStat
        .upsert({
          where: { affiliateId_eventId: { affiliateId: affiliate.id, eventId: event.id } },
          update: { clicks: { increment: 1 } },
          create: { affiliateId: affiliate.id, eventId: event.id, clicks: 1 },
        })
        .catch(() => undefined);
    }
  }

  const response = NextResponse.json({ tracked: true });
  response.cookies.set(affiliateRefCookieName, affiliate.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * AFFILIATE_REF_COOKIE_DAYS,
  });
  return response;
}
