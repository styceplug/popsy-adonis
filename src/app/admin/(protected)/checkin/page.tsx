import { AdminCheckInPanel } from "@/components/admin/admin-check-in-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Check In | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCheckInPage() {
  const tiers = await prisma.ticketTier.findMany({
    where: { event: { status: { in: ["PUBLISHED", "SOLD_OUT"] } }, NOT: { entryDays: { isEmpty: true } } },
    select: { entryDays: true },
  });
  const gateDays = [...new Set(tiers.flatMap((tier) => tier.entryDays))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">At the gate</p>
      <h2 className="mt-2 font-display text-5xl font-black">Check in</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/58">
        Scan a ticket QR code or paste the ticket URL/code manually. Successful scans immediately mark the ticket as checked in.
      </p>
      <AdminCheckInPanel gateDays={gateDays} />
    </div>
  );
}
