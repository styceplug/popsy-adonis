import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketTierPicker } from "@/components/events/ticket-tier-picker";
import type { Event } from "@/lib/sample-data";
import { events } from "@/lib/sample-data";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://popsyadonis.com";
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

function getEventDisplayDate(event: { slug: string }) {
  if (event.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (event.slug === "summer-finale-after-exam-party") return "5th September, 2026 · 7PM till dawn";
  return undefined;
}

function getEventSeoDescription(event: Event) {
  if (event.slug === "summer-finale-after-exam-party") {
    return "FLUX Summer Experience — Summer Finale. After-exam water splash party on 5th September at D Cube Place, Satellite, EKSU. Foam, pool, water guns, free barbing, piercing, henna and tattoos. 7PM till dawn.";
  }

  const fallback = `${event.title} — a Popsy Adonis experience in ${event.city}. ${
    event.status === "upcoming" ? "Get your tickets now." : "See the recap and gallery."
  }`;

  return (event.summary ?? fallback).replace(/\s+/g, " ").trim().slice(0, 220);
}

function getWriteupParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getEventExpectations(event: Event) {
  if (event.slug === "summer-finale-after-exam-party") {
    return [
      "Foam machines",
      "Swimming pool",
      "Water guns",
      "Free barbing",
      "Free piercing",
      "Free henna and tattoo sessions",
    ];
  }

  return ["Free swimming access", "Free piercing sessions", "Free tattoo sessions", "Music, entertainment, and summer-party energy"];
}

function mapDbEventToPublicEvent(event: {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startsAt: Date;
  status: string;
  heroImage: string | null;
  ticketTiers: Array<{
    id: string;
    name: string;
    priceKobo: number;
    perks: string[];
  }>;
}): Event {
  const isPast = event.status === "COMPLETED" || event.startsAt < new Date();

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { slug },
    include: { ticketTiers: { where: { isActive: true }, orderBy: { priceKobo: "asc" } } },
  });
  const event = dbEvent ? mapDbEventToPublicEvent(dbEvent) : events.find((item) => item.slug === slug);

  if (!event) {
    return {
      title: "Event Not Found | Popsy Adonis",
    };
  }

  const pageUrl = `${SITE_URL}/events/${event.slug}`;
  const imageUrl = `${SITE_URL}${event.heroImage}`;

  const description = getEventSeoDescription(event);

  const shortTitle =
    event.status === "upcoming"
      ? `${event.title} — Get Tickets | Popsy Adonis`
      : `${event.title} — Recap | Popsy Adonis`;

  return {
    title: shortTitle,
    description,
    alternates: {
      canonical: `/events/${event.slug}`,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title: shortTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${event.title} — Popsy Adonis`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shortTitle,
      description,
      images: [imageUrl],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { slug },
    include: {
      ticketTiers: {
        where: { isActive: true },
        orderBy: { priceKobo: "asc" },
      },
      addOns: {
        where: { isActive: true },
        orderBy: { priceKobo: "asc" },
      },
    },
  });
  const event = dbEvent ? mapDbEventToPublicEvent(dbEvent) : events.find((item) => item.slug === slug);

  if (!event) notFound();

  const dbTiers = dbEvent?.ticketTiers ?? await prisma.ticketTier.findMany({
    where: {
      eventId: event.id,
      isActive: true,
    },
    orderBy: { priceKobo: "asc" },
  });
  const dbAddOns = dbEvent?.addOns ?? await prisma.eventAddOn.findMany({
    where: {
      eventId: event.id,
      isActive: true,
    },
    orderBy: { priceKobo: "asc" },
  });
  const ticketEvent = {
    ...event,
    tiers:
      dbTiers.length > 0
        ? dbTiers.map((tier) => ({
            id: tier.id,
            name: tier.name,
            priceKobo: tier.priceKobo,
            perks: tier.perks,
          }))
        : event.tiers,
    addOns: dbAddOns.map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      priceKobo: addOn.priceKobo,
      remaining: Math.max(addOn.stock - addOn.soldCount, 0),
      description: addOn.description,
    })),
  };

  const date = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(event.startsAt));
  const displayDate = event.displayDate ?? date;
  const expectations = getEventExpectations(event);

  return (
    <main className="bg-ink pt-24 text-paper">
      <section
        className="min-h-[62vh] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5,5,5,.92), rgba(5,5,5,.38)), url(${event.heroImage})`,
        }}
      >
        <div className="section-shell flex min-h-[62vh] items-end pb-12">
          <div>
            <p className="text-xs font-black uppercase text-gold">
              {displayDate}
            </p>
            <h1 className="display-title mt-4 max-w-5xl text-6xl md:text-8xl">
              {event.title}
            </h1>
            <p className="mt-5 text-lg text-paper/70">
              {event.venue}, {event.city}
            </p>
          </div>
        </div>
      </section>
      <section className="section-shell grid gap-8 py-16 md:grid-cols-[1fr_420px]">
        <div className="max-w-2xl text-lg leading-9 text-paper/68">
          {getWriteupParagraphs(
            event.summary ??
              "A Popsy Adonis experience built around music, campus culture, community, and unforgettable moments.",
          ).map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 24)}`}
              className={`whitespace-pre-line ${index === 0 ? "font-black text-paper" : "mt-5"}`}
            >
              {paragraph}
            </p>
          ))}
          {event.status === "upcoming" ? (
            <div className="mt-8 rounded-ui border border-gold/30 bg-gold/10 p-5">
              <p className="text-sm font-black uppercase text-gold">
                What to expect
              </p>
              <ul className="mt-4 grid gap-2 text-base leading-7 text-paper/72">
                {expectations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {event.gallery ? (
            <div className="mt-10">
              <p className="text-xs font-black uppercase text-gold">Gallery</p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {event.gallery.map((image) => (
                  <div
                    key={image}
                    className="aspect-square rounded-ui border border-white/10 bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {ticketEvent.tiers.length > 0 ? <TicketTierPicker event={ticketEvent} /> : null}
      </section>
    </main>
  );
}
