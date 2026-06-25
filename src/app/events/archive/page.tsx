import type { Metadata } from "next";
import { events } from "@/lib/sample-data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Past Events Archive | Popsy Adonis",
  description:
    "A full archive of Popsy Adonis events — EKSU Fest 1.0 & 2.0, house parties, hangouts, football competitions, birthday activations, and campus experiences in Ekiti and Lagos.",
  alternates: {
    canonical: "/events/archive",
  },
  openGraph: {
    type: "website",
    url: "https://popsyadonis.com/events/archive",
    title: "Past Events Archive | Popsy Adonis",
    description:
      "A full archive of Popsy Adonis events — EKSU Fest 1.0 & 2.0, house parties, hangouts, football competitions, birthday activations, and campus experiences in Ekiti and Lagos.",
    images: [
      {
        url: "/EVENTS/EKSU%20FEST%2B%2B%2B%2B.jpg",
        width: 1200,
        height: 630,
        alt: "EKSU Fest 2.0 — Popsy Adonis Past Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Past Events Archive | Popsy Adonis",
    description:
      "EKSU Fest, house parties, hangouts, football competitions — the full Popsy Adonis event archive.",
    images: ["/EVENTS/EKSU%20FEST%2B%2B%2B%2B.jpg"],
  },
};

export default function EventArchivePage() {
  const past = events.filter((event) => event.status === "past");

  return (
    <main className="bg-ink pt-28 text-paper">
      <section className="section-shell pb-20">
        <p className="text-xs font-black uppercase text-gold">
          Authority gallery
        </p>
        <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">
          Past Events Archive
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-paper/64">
          Real proof from Popsy Adonis campus activations, EKSU Fest editions,
          listening parties, hangouts, and community moments.
        </p>
        <div className="mt-12 grid gap-5">
          {past.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="overflow-hidden rounded-ui border border-white/10 bg-white/[0.035] md:grid md:grid-cols-[.88fr_1.12fr]"
            >
              <div
                className="min-h-90 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.05), rgba(5,5,5,.55)), url(${event.heroImage})`,
                }}
              />
              <div className="p-5 md:p-7">
                <p className="text-xs font-black uppercase text-gold">
                  Photos + recap
                </p>
                <h2 className="mt-2 font-display text-4xl font-black">
                  {event.title}
                </h2>
                <p className="mt-3 text-sm text-paper/62">
                  {event.venue}, {event.city}
                </p>
                {event.summary ? (
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-paper/64">
                    {event.summary}
                  </p>
                ) : null}
                <p className="mt-5 text-sm font-black text-gold">
                  Read event story
                </p>
                {event.gallery ? (
                  <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {event.gallery.map((image) => (
                      <div
                        key={image}
                        className="aspect-square rounded-ui border border-white/10 bg-cover bg-center"
                        style={{ backgroundImage: `url(${image})` }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
