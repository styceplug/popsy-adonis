import { getEventDisplayDate, isEventPast } from "@/lib/event-display";
import { prisma } from "@/lib/prisma";
import type { Event } from "@/lib/sample-data";

/**
 * Every published event that has not happened yet, soonest first, from the database.
 * A database hiccup returns an empty list rather than breaking the page.
 */
export async function getLiveEvents(): Promise<Event[]> {
  const candidates = await prisma.event
    .findMany({
      where: { status: { in: ["PUBLISHED", "SOLD_OUT"] } },
      orderBy: { startsAt: "asc" },
    })
    .catch(() => []);

  return candidates
    .filter((event) => !isEventPast(event))
    .map((event) => {
      const label = getEventDisplayDate(event);

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        venue: event.venue,
        city: event.city,
        startsAt: event.startsAt.toISOString(),
        displayDate: typeof label === "string" ? label : undefined,
        heroImage: event.heroImage ?? "/EVENTS/SummerFinale-main.JPG",
        summary: event.description,
        status: "upcoming" as const,
        tiers: [],
      };
    });
}
