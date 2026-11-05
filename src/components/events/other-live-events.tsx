import { EventCard } from "@/components/events/event-card";
import { getEventDisplayDate, isEventPast } from "@/lib/event-display";
import { prisma } from "@/lib/prisma";

/** "Check other live events": every other event still on sale, shown under an event's tickets. */
export async function OtherLiveEvents({ currentSlug }: { currentSlug: string }) {
  const candidates = await prisma.event
    .findMany({
      where: { status: { in: ["PUBLISHED", "SOLD_OUT"] }, slug: { not: currentSlug } },
      orderBy: { startsAt: "asc" },
    })
    .catch(() => []);
  const live = candidates.filter((event) => !isEventPast(event)).slice(0, 4);

  if (live.length === 0) return null;

  return (
    <section className="section-shell border-t border-white/10 pb-20 pt-14">
      <p className="text-xs font-black uppercase text-gold">More from Popsy Adonis</p>
      <h2 className="mt-3 font-display text-4xl font-black md:text-5xl">Check other live events</h2>
      <div className={`mt-8 grid gap-5 ${live.length > 1 ? "xl:grid-cols-2" : "max-w-4xl"}`}>
        {live.map((event) => {
          const label = getEventDisplayDate(event);
          return (
            <EventCard
              key={event.id}
              event={{
                id: event.id,
                title: event.title,
                slug: event.slug,
                venue: event.venue,
                city: event.city,
                startsAt: event.startsAt.toISOString(),
                displayDate: typeof label === "string" ? label : undefined,
                heroImage: event.heroImage ?? "/EVENTS/SummerFinale-main.JPG",
                status: "upcoming",
                tiers: [],
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
