import type { Metadata } from "next";
import { EventCard } from "@/components/events/event-card";
import { events } from "@/lib/sample-data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Events & Ticketing | Popsy Adonis",
  description:
    "Upcoming Popsy Adonis events in Ekiti and Lagos. Summer Time in Ekiti early bird tickets are ₦3,000 and VIP tickets are ₦20,000. Campus parties, festivals, and live experiences.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    type: "website",
    url: "https://popsyadonis.com/events",
    title: "Events & Ticketing | Popsy Adonis",
    description:
      "Upcoming Popsy Adonis events in Ekiti and Lagos. Summer Time in Ekiti early bird tickets are ₦3,000 and VIP tickets are ₦20,000. Campus parties, festivals, and live experiences.",
    images: [
      {
        // Use the upcoming event hero as the share image
        url: "/POPSY%20ADONIS%20FLUX%20PARTY.png",
        width: 1200,
        height: 630,
        alt: "Summer Time in Ekiti — Popsy Adonis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events & Ticketing | Popsy Adonis",
    description:
      "Upcoming Popsy Adonis events in Ekiti and Lagos. Summer Time in Ekiti early bird tickets are ₦3,000 and VIP tickets are ₦20,000.",
    images: ["/POPSY%20ADONIS%20FLUX%20PARTY.png"],
  },
};

export default function EventsPage() {
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
          Tickets currently on sale: Early Bird ₦3,000 and VIP ₦20,000.
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
