export function getEventDisplayDate(input: { slug: string; startsAt: Date | string }) {
  if (input.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (input.slug === "summer-finale-after-exam-party") return "Date to be announced";

  return input.startsAt;
}
