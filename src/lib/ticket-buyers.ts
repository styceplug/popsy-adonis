import { prisma } from "@/lib/prisma";

export type TicketBuyer = {
  email: string;
  orderCount: number;
  lastPurchaseAt: Date;
};

export async function getTicketBuyers(): Promise<TicketBuyer[]> {
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ status: "PAID" }, { transaction: { status: "SUCCESS" } }],
      items: { some: { itemType: "ticket" } },
    },
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const buyers = new Map<string, TicketBuyer>();
  for (const order of orders) {
    const email = order.email.trim().toLowerCase();
    if (!email) continue;

    const existing = buyers.get(email);
    if (existing) {
      existing.orderCount += 1;
    } else {
      buyers.set(email, { email, orderCount: 1, lastPurchaseAt: order.createdAt });
    }
  }

  return [...buyers.values()];
}

export async function getTicketBuyerEmails() {
  const buyers = await getTicketBuyers();
  return buyers.map((buyer) => buyer.email);
}
