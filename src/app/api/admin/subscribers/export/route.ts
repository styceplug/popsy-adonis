import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getTicketBuyers } from "@/lib/ticket-buyers";

export const runtime = "nodejs";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csvRow(cells: Array<string | number>) {
  return cells.map(csvCell).join(",");
}

export async function GET(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const list = request.nextUrl.searchParams.get("list");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (list === "subscribers") {
    const subscribers = await prisma.waitlistSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    const csv = [
      csvRow(["email", "source", "status", "joined"]),
      ...subscribers.map((subscriber) =>
        csvRow([
          subscriber.email,
          subscriber.source,
          subscriber.isActive ? "active" : "inactive",
          subscriber.createdAt.toISOString(),
        ]),
      ),
    ].join("\n");

    return csvResponse(csv, `popsy-subscribers-${today}.csv`);
  }

  if (list === "buyers") {
    const buyers = await getTicketBuyers();
    const csv = [
      csvRow(["email", "orders", "last_purchase"]),
      ...buyers.map((buyer) =>
        csvRow([buyer.email, buyer.orderCount, buyer.lastPurchaseAt.toISOString()]),
      ),
    ].join("\n");

    return csvResponse(csv, `popsy-ticket-buyers-${today}.csv`);
  }

  return NextResponse.json({ message: "Choose a list to export." }, { status: 400 });
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
