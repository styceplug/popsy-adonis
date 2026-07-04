import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const eventId = "event-summer-time-ekiti";
  const tiers = [
    {
      id: "tier-summer-time-ekiti-early-bird",
      name: "Regular",
      priceKobo: 500_000,
      capacity: 500,
      perks: ["Regular access", "Free swimming", "Free piercing", "Free tattoo sessions"],
    },
    {
      id: "tier-summer-time-ekiti-vip",
      name: "VIP",
      priceKobo: 2_000_000,
      capacity: 100,
      perks: ["VIP access", "Priority entry", "Free Water Gun", "Free swimming", "Free piercing", "Free tattoo sessions"],
    },
    {
      id: "tier-summer-time-ekiti-table-4",
      name: "Table for 4",
      priceKobo: 10_000_000,
      capacity: 20,
      perks: ["Table reservation for 4", "Priority entry", "Group seating", "Free swimming", "Free piercing", "Free tattoo sessions"],
    },
  ];

  for (const tier of tiers) {
    await prisma.ticketTier.upsert({
      where: { id: tier.id },
      update: {
        name: tier.name,
        priceKobo: tier.priceKobo,
        capacity: tier.capacity,
        perks: tier.perks,
        isActive: true,
      },
      create: {
        ...tier,
        eventId,
        isActive: true,
      },
    });
  }

  const rows = await prisma.ticketTier.findMany({
    where: { eventId },
    orderBy: { priceKobo: "asc" },
    select: { id: true, name: true, priceKobo: true, isActive: true },
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
