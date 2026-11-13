// Adds FLUX Experience Movie Night - December Edition, and moves FLUX Experience November
// (November Rave Edition) to its real date, Saturday 21st November 2026 at 7PM.
// Safe to run again: the event and its tier match by id, so a rerun updates text and prices
// but never resets tickets already sold.
//
//   node scripts/add-flux-movie-night.mjs [--publish]
//
// --publish  puts Movie Night on the events page (otherwise it is saved as Draft to check first)
//
// The Early Bird tier is created switched on, but tickets can only be bought from
// Saturday 14th November 2026, 6PM (see src/lib/ticket-sales-schedule.ts). Until then the
// event page shows the tier with its opening time.
// The December date and venue are not announced yet, so the event shows "Date to be announced";
// set the real date, venue and remove the date label in admin once they are confirmed.
import { PrismaClient } from "@prisma/client";

const publish = process.argv.includes("--publish");

const MOVIE_NIGHT_ID = "event-flux-movie-night-dec-2026";
const EARLY_BIRD_TIER_ID = "tier-flux-movie-night-dec-2026-early-bird";

const NOVEMBER_SLUG = "flux-experience-november";
// 7PM in Lagos (UTC+1).
const NOVEMBER_STARTS_AT = new Date("2026-11-21T18:00:00.000Z");

const description = `FLUX EXPERIENCE IS GETTING BIGGER! 🚀🍿
And this time, we're taking things OUTDOORS! 🌌🎬

For the first time, we're hosting our very own OUTDOOR MOVIE NIGHT, where you get to enjoy TWO DIFFERENT MOVIE GENRES under a beautiful night sky, surrounded by a lovely outdoor atmosphere.

We're bringing you two different movie niches in one night, so expect variety, excitement and unforgettable moments!

But don't come alone! Bring your movie buddy, your blanket and duvet, get comfortable and prepare for a different kind of movie experience. ❤️

🎟️ EARLY BIRD DROPS SATURDAY 14TH NOVEMBER BY 6PM!
₦2,000 ONLY — LIMITED TO 50 PEOPLE!

Once the 50 slots are gone, they're gone!
Trust us, this is going to be a DOPE EXPERIENCE. 🍿🔥`;

const movieNight = {
  title: "FLUX Experience Movie Night - December Edition",
  slug: "flux-experience-movie-night-december",
  description,
  venue: "Outdoor venue to be announced",
  city: "Ekiti",
  // Placeholder inside December so the event sorts after the November rave; the label is what people see.
  startsAt: new Date("2026-12-01T18:00:00.000Z"),
  dateLabel: "December 2026 · Date to be announced",
  heroImage: "/EVENTS/flux-movie-night-december-2026.jpg",
  highlights: [
    "Outdoor movie night under the night sky",
    "Two different movie genres in one night",
    "Bring your movie buddy",
    "Come with your blanket and duvet",
  ],
  status: publish ? "PUBLISHED" : "DRAFT",
};

const earlyBird = {
  name: "Early Bird",
  priceKobo: 2_000 * 100,
  capacity: 50,
  perks: ["Limited to the first 50 attendees", "Two movie genres, one night", "Outdoor screening"],
};

const prisma = new PrismaClient();

try {
  const november = await prisma.event.findUnique({
    where: { slug: NOVEMBER_SLUG },
    select: { id: true, title: true, startsAt: true },
  });

  if (!november) {
    console.log(`Skipped: no event with slug "${NOVEMBER_SLUG}" to move to 21st November.`);
  } else if (november.startsAt.getTime() === NOVEMBER_STARTS_AT.getTime()) {
    console.log(`Already right: ${november.title} is on Sat 21st Nov 2026, 7PM.`);
  } else {
    await prisma.event.update({ where: { id: november.id }, data: { startsAt: NOVEMBER_STARTS_AT } });
    console.log(`Moved: ${november.title} from ${november.startsAt.toISOString()} to Sat 21st Nov 2026, 7PM.`);
  }

  const event = await prisma.event.upsert({
    where: { id: MOVIE_NIGHT_ID },
    update: movieNight,
    create: { id: MOVIE_NIGHT_ID, ...movieNight },
  });

  await prisma.ticketTier.upsert({
    where: { id: EARLY_BIRD_TIER_ID },
    // soldCount is left alone, so a rerun never wipes out tickets already sold.
    update: { ...earlyBird, isActive: true },
    create: { id: EARLY_BIRD_TIER_ID, eventId: event.id, ...earlyBird, isActive: true },
  });

  console.log(
    `${event.status === "PUBLISHED" ? "Live" : "Draft"}: ${event.title} (/events/${event.slug}), Early Bird N2,000 x 50, on sale from Sat 14th Nov 2026, 6PM`,
  );
} finally {
  await prisma.$disconnect();
}
