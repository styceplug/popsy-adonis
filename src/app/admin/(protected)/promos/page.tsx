import { PromoAdminPanel } from "@/components/admin/promo-admin-panel";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Promos | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPromosPage() {
  const [tiers, promos] = await Promise.all([
    prisma.ticketTier.findMany({
      where: {
        event: { status: "PUBLISHED" },
        isActive: true,
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
      orderBy: [{ event: { startsAt: "asc" } }, { priceKobo: "asc" }],
    }),
    prisma.ticketPromo.findMany({
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Promos & pricing</p>
      <h2 className="mt-2 font-display text-5xl font-black">Promo control</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Set base ticket prices, schedule limited promo prices, and control how many discounted tickets each buyer can claim.
      </p>
      <div className="mt-6">
        <PromoAdminPanel
          tiers={tiers.map((tier) => ({
            id: tier.id,
            name: tier.name,
            priceKobo: tier.priceKobo,
            capacity: tier.capacity,
            soldCount: tier.soldCount,
            event: tier.event,
          }))}
          promos={promos.map((promo) => ({
            id: promo.id,
            ticketTierId: promo.ticketTierId,
            name: promo.name,
            promoPriceKobo: promo.promoPriceKobo,
            startsAt: promo.startsAt.toISOString(),
            endsAt: promo.endsAt?.toISOString() ?? null,
            quantityLimit: promo.quantityLimit,
            maxPerBuyer: promo.maxPerBuyer,
            isActive: promo.isActive,
          }))}
        />
      </div>
    </div>
  );
}

