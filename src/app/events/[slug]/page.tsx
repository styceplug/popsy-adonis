import { notFound } from "next/navigation";
import { TicketTierPicker } from "@/components/events/ticket-tier-picker";
import { events } from "@/lib/sample-data";

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = events.find((item) => item.slug === slug);

  if (!event) notFound();

  const date = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(event.startsAt));
  const displayDate = event.displayDate ?? date;

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
            <p className="text-xs font-black uppercase text-gold">{displayDate}</p>
            <h1 className="display-title mt-4 max-w-5xl text-6xl md:text-8xl">{event.title}</h1>
            <p className="mt-5 text-lg text-paper/70">{event.venue}, {event.city}</p>
          </div>
        </div>
      </section>
      <section className="section-shell grid gap-8 py-16 md:grid-cols-[1fr_420px]">
        <div className="max-w-2xl text-lg leading-9 text-paper/68">
          <p>{event.summary ?? "A Popsy Adonis experience built around music, campus culture, community, and unforgettable moments."}</p>
          {event.status === "upcoming" ? (
            <div className="mt-8 rounded-ui border border-gold/30 bg-gold/10 p-5">
              <p className="text-sm font-black uppercase text-gold">What to expect</p>
              <ul className="mt-4 grid gap-2 text-base leading-7 text-paper/72">
                <li>Free swimming access</li>
                <li>Free piercing sessions</li>
                <li>Free tattoo sessions</li>
                <li>Music, entertainment, and summer-party energy</li>
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
        {event.tiers.length > 0 ? <TicketTierPicker event={event} /> : null}
      </section>
    </main>
  );
}
