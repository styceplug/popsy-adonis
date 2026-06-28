import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EARLY_BIRD_PROMO_TIER_ID } from "@/lib/ticket-promo-constants";
import { getTicketPromoStatus } from "@/lib/ticket-promos";

export async function GET() {
  const status = await getTicketPromoStatus(prisma, EARLY_BIRD_PROMO_TIER_ID);

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
