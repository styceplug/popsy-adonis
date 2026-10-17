export function getEventDisplayDate(input: { slug: string; startsAt: Date | string; dateLabel?: string | null }) {
  if (input.dateLabel?.trim()) return input.dateLabel.trim();
  if (input.slug === "summer-time-in-ekiti") return "Fri, 7th August, 2026";
  if (input.slug === "summer-finale-after-exam-party") return "5th September, 2026 · 7PM till dawn";

  return input.startsAt;
}

// How long after the start an event without an end time still counts as happening.
const EVENT_RUNNING_GRACE_MS = 12 * 60 * 60 * 1000;

/**
 * An event is past only when marked COMPLETED, or once it has clearly ended. A date label
 * ("Date to be announced") means the real date is not set yet, so the event stays upcoming.
 */
export function isEventPast(event: {
  status: string;
  startsAt: Date;
  endsAt?: Date | null;
  dateLabel?: string | null;
}) {
  if (event.status === "COMPLETED") return true;
  if (event.dateLabel?.trim()) return false;

  const endsAt = event.endsAt ?? new Date(event.startsAt.getTime() + EVENT_RUNNING_GRACE_MS);
  return endsAt.getTime() < Date.now();
}
