import type { Metadata } from "next";
import { isEventPast } from "@/lib/event-display";
import { openGraphFor } from "@/lib/seo";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/lib/sample-data";
import { events as sampleEvents } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Read events on every request so admin changes show at once, not only after a rebuild.
export const dynamic = "force-dynamic";

const EVENTS_TITLE = "Events & Ticketing | Popsy Adonis";

// The share card and description follow whichever event is next, so they never go stale.
export async function generateMetadata(): Promise<Metadata> {
  const candidates = await prisma.event
    .findMany({
      where: { status: { in: ["PUBLISHED", "SOLD_OUT"] } },
      orderBy: { startsAt: "asc" },
      select: { slug: true, title: true, venue: true, city: true, startsAt: true, endsAt: true, dateLabel: true, status: true },
    })
    .catch(() => []);
  const next = candidates.find((event) => !isEventPast(event));

  const nextDate = next ? getEventDisplayDate(next) : null;
  const description = next
    ? `Upcoming Popsy Adonis events in Ekiti and beyond. Next up: ${next.title}, ${
        typeof nextDate === "string"
          ? nextDate
          : new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(next.startsAt)
      } at ${next.venue}, ${next.city}. Get your tickets on popsyadonis.com.`
    : "Popsy Adonis events and ticketing: parties, festivals and campus experiences in Ekiti and beyond.";

  return {
    title: EVENTS_TITLE,
    description,
    alternates: {
      canonical: "/events",
    },
    openGraph: openGraphFor({
      title: EVENTS_TITLE,
      description,
      path: "/events",
      image: next
        ? { url: `/events/${next.slug}/opengraph-image`, width: 1200, height: 630, alt: next.title }
        : undefined,
    }),
  };
}

function getEventDisplayDate(event: { slug: string; dateLabel?: string | null }) {
  if (event.dateLabel?.trim()) return event.dateLabel.trim();
  if (event.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (event.slug === "summer-finale-after-exam-party") return "5th September, 2026 · 7PM till dawn";
  return undefined;
}

function mapDbEventToCard(event: Awaited<ReturnType<typeof getDbEvents>>[number]): Event {
  const isPast = isEventPast(event);

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    venue: event.venue,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    displayDate: getEventDisplayDate(event),
    heroImage: event.heroImage ?? "/EVENTS/SummerFinale-main.JPG",
    summary: event.description,
    status: isPast ? "past" : "upcoming",
    tiers: event.ticketTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      priceKobo: tier.priceKobo,
      perks: tier.perks,
    })),
  };
}

async function getDbEvents() {
  return prisma.event.findMany({
    where: {
      status: { in: ["PUBLISHED", "SOLD_OUT", "COMPLETED"] },
    },
    include: {
      ticketTiers: {
        where: { isActive: true },
        orderBy: { priceKobo: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

export default async function EventsPage() {
  const dbEvents = await getDbEvents();
  const events = dbEvents.length > 0 ? dbEvents.map(mapDbEventToCard) : sampleEvents;
  const upcomingEvents = events.filter((event) => event.status === "upcoming");
  const pastEvents = events.filter((event) => event.status === "past");

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-12">
        <p className="text-xs font-black uppercase text-gold">
          Events & Ticketing
        </p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">
          Upcoming Events
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          FLUX Summer Experience — Summer Finale lands at D Cube Place, Satellite, EKSU on 5th September. 7PM till dawn.
        </p>
        <div className="mt-12 grid gap-5">
          {upcomingEvents.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </section>
      <section className="section-shell pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-t border-white/10 pt-12">
          <div>
            <p className="text-xs font-black uppercase text-gold">
              Past Events Archive
            </p>
            <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
              Proof from the rooms.
            </h2>
          </div>
          <Link
            href="/events/archive"
            className="text-sm font-black text-paper/68 transition hover:text-gold"
          >
            View full archive
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pastEvents.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="group min-h-85 rounded-ui border border-white/10 bg-cover bg-center p-5 transition hover:border-gold"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.08), rgba(5,5,5,.86)), url(${event.heroImage})`,
              }}
            >
              <div className="flex h-full flex-col justify-end">
                <p className="text-xs font-black uppercase text-gold">
                  Read recap
                </p>
                <h3 className="mt-2 font-display text-2xl font-black group-hover:text-gold">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-paper/62">
                  {event.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
