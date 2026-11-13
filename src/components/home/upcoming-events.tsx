import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { getLiveEvents } from "@/lib/live-events";

export async function UpcomingEvents() {
  const events = await getLiveEvents();

  return (
    <section className="bg-coal py-20">
      <div className="section-shell">
        <p className="text-xs font-black uppercase text-gold">Events & Ticketing</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-black text-paper md:text-6xl">
          Upcoming rooms with real demand.
        </h2>
        {events.length > 0 ? (
          <div className="mt-10 grid gap-5">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-ui border border-white/10 bg-white/[0.035] p-6">
            <p className="text-lg leading-8 text-paper/70">New dates are on the way. Follow the page so you don&apos;t miss the next drop.</p>
            <Link
              href="/events/archive"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-paper/80 transition hover:text-gold"
            >
              See past events
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
