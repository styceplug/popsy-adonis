export function normalizeTicketCode(value: string) {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const ticketIndex = url.pathname.split("/").findIndex((part) => part === "tickets");
    if (ticketIndex >= 0) {
      return url.pathname.split("/")[ticketIndex + 1] ?? trimmed;
    }
  } catch {
    // Plain QR code input.
  }

  return trimmed.replace(/^\/?tickets\//, "");
}
