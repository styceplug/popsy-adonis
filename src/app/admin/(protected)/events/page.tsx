import { EventAdminPanel } from "@/components/admin/event-admin-panel";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Events | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    include: {
      ticketTiers: {
        orderBy: { priceKobo: "asc" },
      },
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Selling</p>
      <h2 className="mt-2 font-display text-5xl font-black">Events</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Everything about an event lives here: details, ticket tiers, prices, and how many tickets are on sale.
      </p>
      <div className="mt-8">
        <EventAdminPanel
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            venue: event.venue,
            city: event.city,
            startsAt: event.startsAt.toISOString(),
            status: event.status,
            heroImage: event.heroImage,
            ticketTiers: event.ticketTiers.map((tier) => ({
              id: tier.id,
              name: tier.name,
              priceKobo: tier.priceKobo,
              capacity: tier.capacity,
              soldCount: tier.soldCount,
              perks: tier.perks,
              isActive: tier.isActive,
            })),
          }))}
        />
      </div>
    </div>
  );
}
