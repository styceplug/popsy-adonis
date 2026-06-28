import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTicketPromoStatus } from "@/lib/ticket-promos";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ticketTierIds = url.searchParams
    .get("ticketTierIds")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 20) ?? [];

  const statuses = await Promise.all(
    ticketTierIds.map(async (ticketTierId) => getTicketPromoStatus(prisma, ticketTierId)),
  );

  return NextResponse.json(
    { promos: statuses },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

