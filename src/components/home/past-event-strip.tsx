import Link from "next/link";
import { events } from "@/lib/sample-data";

export function PastEventStrip() {
  const pastEvents = events.filter((event) => event.status === "past").slice(0, 3);

  return (
    <section className="bg-ink py-20">
      <div className="section-shell">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <div>
            <p className="text-xs font-black uppercase text-gold">Past events archive</p>
            <h2 className="mt-3 font-display text-4xl font-black text-paper md:text-6xl">Proof before promise.</h2>
            <Link href="/events/archive" className="mt-6 inline-flex text-sm font-black text-paper/68 transition hover:text-gold">
              View all past events
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <Link
                key={event.slug}
                href={`/events/${event.slug}`}
                className="min-h-75 rounded-ui border border-white/10 bg-cover bg-center p-5 transition hover:border-gold"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(5,5,5,.1), rgba(5,5,5,.86)), url(${event.heroImage})`,
                }}
              >
                <p className="mt-48 text-xs font-bold uppercase text-gold">Recap gallery</p>
                <h3 className="mt-2 font-display text-2xl font-black">{event.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
