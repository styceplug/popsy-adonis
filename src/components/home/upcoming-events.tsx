import { events } from "@/lib/sample-data";
import { EventCard } from "@/components/events/event-card";

export function UpcomingEvents() {
  return (
    <section className="bg-coal py-20">
      <div className="section-shell">
        <p className="text-xs font-black uppercase text-gold">Events & Ticketing</p>
        <h2 className="mt-3 max-w-3xl font-display text-4xl font-black text-paper md:text-6xl">
          Upcoming rooms with real demand.
        </h2>
        <div className="mt-10 grid gap-5">
          {events.filter((event) => event.status === "upcoming").map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

