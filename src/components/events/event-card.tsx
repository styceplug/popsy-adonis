import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Event } from "@/lib/sample-data";

export function EventCard({ event }: { event: Event }) {
  const date = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(event.startsAt));
  const displayDate = event.displayDate ?? date;

  return (
    <Link href={`/events/${event.slug}`} className="group grid overflow-hidden rounded-ui border border-white/10 bg-white/[0.035] md:grid-cols-[.95fr_1.05fr]">
      <div
        className="min-h-[280px] bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
        style={{ backgroundImage: `url(${event.heroImage})` }}
      />
      <div className="flex flex-col justify-between p-6">
        <div>
          <p className="text-xs font-black uppercase text-gold">{displayDate}</p>
          <h3 className="mt-3 font-display text-3xl font-black text-paper">{event.title}</h3>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-paper/62">
            <MapPin size={16} />
            {event.venue}, {event.city}
          </p>
        </div>
        <p className="mt-8 text-sm font-bold text-paper/80 group-hover:text-gold">
          {event.status === "upcoming" ? "Select tickets" : "Read recap"}
        </p>
      </div>
    </Link>
  );
}
