import type { Metadata } from "next";
import { EventCard } from "@/components/events/event-card";
import type { Event } from "@/lib/sample-data";
import { events as sampleEvents } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Events & Ticketing | Popsy Adonis",
  description:
    "Upcoming Popsy Adonis events in Ekiti and Lagos. Early bird tickets are now available for Summer Finale - After Exam Party.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    type: "website",
    url: "https://popsyadonis.com/events",
    
    title: "Events & Ticketing | Popsy Adonis",
    description:
      "Upcoming Popsy Adonis events in Ekiti and Lagos. Early bird tickets are now available for Summer Finale - After Exam Party.",
    images: [
      {
        // Use the upcoming event hero as the share image
        url: "/EVENTS/SUMMER%20FINALE.jpeg",
        width: 1200,
        height: 630,
        alt: "Summer Finale - After Exam Party — Popsy Adonis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events & Ticketing | Popsy Adonis",
    description:
      "Upcoming Popsy Adonis events in Ekiti and Lagos. Early bird tickets are now available for Summer Finale - After Exam Party.",
    images: ["/EVENTS/SUMMER%20FINALE.jpeg"],
  },
};

function getEventDisplayDate(event: { slug: string }) {
  if (event.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (event.slug === "summer-finale-after-exam-party") return "Date to be announced";
  return undefined;
}

function mapDbEventToCard(event: Awaited<ReturnType<typeof getDbEvents>>[number]): Event {
  const isPast = event.status === "COMPLETED" || event.startsAt < new Date();

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    venue: event.venue,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    displayDate: getEventDisplayDate(event),
    heroImage: event.heroImage ?? "/EVENTS/SUMMER%20FINALE.jpeg",
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
          Early bird tickets are now available for Summer Finale - After Exam Party.
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
