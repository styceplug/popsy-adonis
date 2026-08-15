import { ManualTicketForm } from "@/components/admin/manual-ticket-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Issue Ticket | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminIssueTicketPage() {
  const tiers = await prisma.ticketTier.findMany({
    where: {
      isActive: true,
      event: { status: "PUBLISHED" },
    },
    include: {
      event: { select: { title: true, startsAt: true } },
    },
    orderBy: [{ event: { startsAt: "asc" } }, { priceKobo: "asc" }],
  });

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">At the gate</p>
      <h2 className="mt-2 font-display text-5xl font-black">Issue a ticket</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Took cash or a transfer outside the website? Issue the ticket here and it is emailed straight to the buyer with a
        scannable QR code, exactly like an online purchase.
      </p>

      <ManualTicketForm
        tiers={tiers.map((tier) => ({
          id: tier.id,
          name: tier.name,
          priceKobo: tier.priceKobo,
          remaining: Math.max(tier.capacity - tier.soldCount, 0),
          eventTitle: tier.event.title,
        }))}
      />
    </div>
  );
}
