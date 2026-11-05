import { ImageResponse } from "next/og";
import { getEventDisplayDate, isEventPast } from "@/lib/event-display";
import { OG_CONTENT_TYPE, asJpeg, OG_SIZE, getOgFonts, getOgImageSrc, getOgLogo, ogColors } from "@/lib/og";
import { prisma } from "@/lib/prisma";
import { events as sampleEvents } from "@/lib/sample-data";

export const alt = "Popsy Adonis event";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Event details are edited in admin, so read the database on every request.
export const dynamic = "force-dynamic";

type CardEvent = { title: string; venue: string; city: string; date: string; image: string | null; upcoming: boolean };

async function getCardEvent(slug: string): Promise<CardEvent | null> {
  const event = await prisma.event.findUnique({ where: { slug } }).catch(() => null);

  if (event) {
    const display = getEventDisplayDate(event);
    return {
      title: event.title,
      venue: event.venue,
      city: event.city,
      date: typeof display === "string" ? display : formatLagosDate(display),
      image: event.heroImage,
      upcoming: !isEventPast(event),
    };
  }

  const sample = sampleEvents.find((item) => item.slug === slug);
  if (!sample) return null;
  return {
    title: sample.title,
    venue: sample.venue,
    city: sample.city,
    date: sample.displayDate ?? formatLagosDate(new Date(sample.startsAt)),
    image: sample.heroImage,
    upcoming: sample.status === "upcoming",
  };
}

function formatLagosDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(value);
}

// Flyers are portrait, so the card puts the flyer on the right and the details on the left.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getCardEvent(slug);
  const [fonts, flyer, logo] = await Promise.all([getOgFonts(), getOgImageSrc(event?.image), getOgLogo()]);
  const picture = flyer ?? logo;
  const titleSize = (event?.title.length ?? 0) > 34 ? 52 : 64;

  return asJpeg(new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: "Inter", background: ogColors.ink }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 64px",
            color: ogColors.paper,
          }}
        >
          <div style={{ fontSize: 22, color: ogColors.gold, letterSpacing: 4, textTransform: "uppercase" }}>
            Popsy Adonis presents
          </div>
          <div style={{ fontSize: titleSize, lineHeight: 1.04, marginTop: 20, letterSpacing: -2 }}>
            {event?.title ?? "Popsy Adonis Events"}
          </div>
          {event ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
              <div style={{ fontSize: 30, color: "rgba(255,253,248,0.85)" }}>{event.date}</div>
              <div style={{ fontSize: 26, marginTop: 10, color: "rgba(255,253,248,0.58)" }}>
                {[event.venue, event.city].filter(Boolean).join(", ")}
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", marginTop: 44 }}>
            <div
              style={{
                display: "flex",
                padding: "14px 28px",
                borderRadius: 12,
                fontSize: 26,
                background: event?.upcoming ? ogColors.gold : "rgba(255,253,248,0.12)",
                color: event?.upcoming ? ogColors.ink : ogColors.paper,
              }}
            >
              {event?.upcoming ? "Get tickets at popsyadonis.com" : "Recap at popsyadonis.com"}
            </div>
          </div>
        </div>
        {picture ? (
          <img src={picture} width={528} height={630} alt="" style={{ objectFit: "cover" }} />
        ) : null}
      </div>
    ),
    { ...size, fonts },
  ));
}
