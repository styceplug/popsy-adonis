import { brand } from "@/lib/sample-data";

export const mixRoom = {
  name: "THE MIX ROOM",
  kicker: "The Popsy Adonis podcast",
  tagline: "Gist. Vibes. Culture. Entertainment.",
  description: "A mix of different genres, gist & everything in between.",
  closer: "No limits. Just THE MIX ROOM.",
  // Add a link per platform once episodes are live, e.g. { label: "YouTube", href: "https://..." }.
  listenLinks: [] as Array<{ label: string; href: string }>,
};

export const mixRoomCasting = {
  title: "We're casting! 3 on-air hosts wanted",
  flyer: "/mixroom/the-mix-room-casting-call.jpg",
  // End of Sunday 15th November 2026 in Lagos; the casting call hides itself after this.
  closesAt: new Date("2026-11-15T22:59:59.000Z"),
  deadlineLabel: "Sunday, 15th November",
  email: brand.email,
  emailSubject: "HOST APPLICATION – [Your Name]",
  location: "Ado-Ekiti, Ekiti State",
  experience: "Not compulsory",
  commitment: "Bi-weekly recording sessions, rehearsals and promotional activities",
  lookingFor: [
    "Bold and outspoken personalities",
    "Confident and articulate speakers",
    "Naturally funny and entertaining individuals",
    "People passionate about media and entertainment",
  ],
  videoOptions: [
    { title: "Interview / hold a conversation", detail: "Ask a mock interview, discuss a real conversation, or keep a casual chat." },
    { title: "Tell a controversial or opinionated narrative", detail: "Bring a hot take, debate, or trending topic." },
    { title: "Deliver a monologue", detail: "Do a personal take, story, or social commentary." },
  ],
  videoNote:
    "Create a 30–90 second monologue or video in the style or energy of your favourite interviewer or YouTuber, but with your own original character and personality. Pick the style you're strongest at: comical / witty, humorous, or serious.",
  include: [
    "Full name",
    "Age (18+)",
    "Location (Ado-Ekiti / nearby)",
    "Phone number",
    "Social media handles (Instagram, TikTok, X, etc.)",
    "Your audition video (30s – 90s)",
    "A short write-up (3–5 sentences) about yourself and why you want to be a host",
  ],
};

export function isMixRoomCastingOpen(now = new Date()) {
  return now.getTime() <= mixRoomCasting.closesAt.getTime();
}

export function mixRoomApplyHref() {
  return `mailto:${mixRoomCasting.email}?subject=${encodeURIComponent(mixRoomCasting.emailSubject)}`;
}
