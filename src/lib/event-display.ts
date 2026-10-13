export function getEventDisplayDate(input: { slug: string; startsAt: Date | string; dateLabel?: string | null }) {
  if (input.dateLabel?.trim()) return input.dateLabel.trim();
  if (input.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (input.slug === "summer-finale-after-exam-party") return "5th September, 2026 · 7PM till dawn";

  return input.startsAt;
}
