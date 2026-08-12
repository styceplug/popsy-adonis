import Link from "next/link";
import {
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  ClipboardCheck,
  Mail,
  Package,
  PackageCheck,
  ScrollText,
  Ticket,
} from "lucide-react";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin | Popsy Adonis",
  robots: {
    index: false,
    follow: false,
  },
};

const shortcutGroups = [
  {
    label: "On event day",
    items: [
      { label: "Scan tickets", description: "Check people in at the gate", href: "/admin/checkin", icon: ClipboardCheck },
      { label: "Find a ticket", description: "Search by name, email, or reference", href: "/admin/tickets", icon: Ticket },
      { label: "Water guns", description: "Hand over paid add-ons", href: "/admin/water-guns", icon: PackageCheck },
    ],
  },
  {
    label: "Selling",
    items: [
      { label: "Events & prices", description: "Edit events, tiers, and prices", href: "/admin/events", icon: CalendarDays },
      { label: "Run a promo", description: "Limited-time discounted tickets", href: "/admin/promos", icon: BadgePercent },
      { label: "PA FLUX store", description: "Merch, stock, and orders", href: "/admin/merch", icon: Package },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Email subscribers", description: "Broadcast to the waitlist", href: "/admin/subscribers", icon: Mail },
      { label: "Activity log", description: "Every staff action, with time", href: "/admin/logs", icon: ScrollText },
    ],
  },
];

export default async function AdminDashboardPage() {
  const [liveEvents, ticketCount, checkedInCount, subscriberCount] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      include: {
        ticketTiers: {
          where: { isActive: true },
          orderBy: { priceKobo: "asc" },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { checkedInAt: { not: null } } }),
    prisma.waitlistSubscriber.count({ where: { isActive: true } }),
  ]);

  const stats = [
    { label: "Tickets issued", value: String(ticketCount) },
    { label: "Checked in", value: String(checkedInCount) },
    { label: "Subscribers", value: String(subscriberCount) },
  ];

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Overview</p>
      <h2 className="mt-2 font-display text-5xl font-black">Dashboard</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="font-display text-3xl font-black md:text-4xl">{stat.value}</p>
            <p className="mt-2 text-xs font-black uppercase text-paper/45">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <p className="text-xs font-black uppercase text-gold">On sale now</p>
        <div className="mt-4 grid gap-4">
          {liveEvents.map((event) => {
            const totalSold = event.ticketTiers.reduce((sum, tier) => sum + tier.soldCount, 0);
            const totalCapacity = event.ticketTiers.reduce((sum, tier) => sum + tier.capacity, 0);

            return (
              <div key={event.id} className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-black">{event.title}</h3>
                    <p className="mt-1 text-sm text-paper/55">
                      {event.venue}, {event.city} ·{" "}
                      {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(event.startsAt)}
                    </p>
                  </div>
                  <p className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-black uppercase text-gold">
                    {totalSold} / {totalCapacity} sold
                  </p>
                </div>
                <div className="mt-5 grid gap-3">
                  {event.ticketTiers.map((tier) => {
                    const soldShare = tier.capacity > 0 ? Math.min(tier.soldCount / tier.capacity, 1) : 0;
                    return (
                      <div key={tier.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <p className="font-bold text-paper">
                            {tier.name} <span className="ml-1 font-black text-gold">{formatNaira(tier.priceKobo)}</span>
                          </p>
                          <p className="text-xs text-paper/48">
                            {tier.soldCount} of {tier.capacity} sold
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(soldShare * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {event.ticketTiers.length === 0 ? (
                    <p className="text-sm text-paper/50">No active ticket tiers. Add tiers from the Events page.</p>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin/events"
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/12 px-4 text-sm font-bold text-paper/72 transition hover:border-paper hover:text-paper"
                  >
                    Edit event & prices
                  </Link>
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/12 px-4 text-sm font-bold text-paper/72 transition hover:border-paper hover:text-paper"
                  >
                    View public page
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
          {liveEvents.length === 0 ? (
            <div className="rounded-ui border border-white/10 bg-white/[0.035] p-6 text-sm text-paper/55">
              No event is on sale right now. Publish an event from the{" "}
              <Link href="/admin/events" className="font-black text-gold">
                Events page
              </Link>{" "}
              to start selling tickets.
            </div>
          ) : null}
        </div>
      </section>

      {shortcutGroups.map((group) => (
        <section key={group.label} className="mt-10">
          <p className="text-xs font-black uppercase text-gold">{group.label}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-ui border border-white/10 bg-white/[0.035] p-5 transition hover:border-gold"
                >
                  <Icon className="text-gold" size={22} />
                  <p className="mt-4 font-display text-xl font-black group-hover:text-gold">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-paper/52">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
