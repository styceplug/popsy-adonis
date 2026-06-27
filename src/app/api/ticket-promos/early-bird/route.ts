import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEarlyBirdPromoStatus } from "@/lib/ticket-promos";

export async function GET() {
  const status = await getEarlyBirdPromoStatus(prisma);

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

