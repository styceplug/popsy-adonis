import Link from "next/link";
import { ArrowLeftRight, CalendarDays, Search, Ticket } from "lucide-react";
import { ResendTicketButton } from "@/components/admin/resend-ticket-button";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Tickets | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; event?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "all";
  const eventParam = params.event ?? "";

  const events = await prisma.event.findMany({
    include: {
      _count: { select: { tickets: true } },
    },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
  });
  const selectedEvent = eventParam === "all" ? null : events.find((event) => event.id === eventParam);

  if (!eventParam || (eventParam !== "all" && !selectedEvent)) {
    const checkedInByEvent = await prisma.ticket.groupBy({
      by: ["eventId"],
      where: { checkedInAt: { not: null } },
      _count: { _all: true },
    });
    const checkedInCounts = new Map(checkedInByEvent.map((row) => [row.eventId, row._count._all]));
    const totalTickets = events.reduce((sum, event) => sum + event._count.tickets, 0);
    const eventsWithTickets = events.filter((event) => event._count.tickets > 0);

    return (
      <div>
        <p className="text-xs font-black uppercase text-gold">At the gate</p>
        <h2 className="mt-2 font-display text-5xl font-black">Tickets</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
          Which event&apos;s tickets do you want to see?
        </p>

        <div className="mt-6 grid gap-3">
          {eventsWithTickets.map((event) => {
            const checkedIn = checkedInCounts.get(event.id) ?? 0;
            return (
              <Link
                key={event.id}
                href={`/admin/tickets?event=${event.id}`}
                className="focus-ring group rounded-ui border border-white/10 bg-white/[0.035] p-4 transition hover:border-gold/50"
              >
                <span className="flex flex-wrap items-start justify-between gap-3">
                  <span>
                    <span className="block font-display text-2xl font-black text-paper group-hover:text-gold">
                      {event.title}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-2 text-xs text-paper/45">
                      <CalendarDays size={13} />
                      {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(event.startsAt)} · {event.venue}, {event.city}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/12 px-3 py-1 text-xs font-black uppercase text-paper/62">
                      {event._count.tickets} ticket{event._count.tickets === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-black uppercase text-gold">
                      {checkedIn} checked in
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
          {eventsWithTickets.length === 0 ? (
            <p className="rounded-ui border border-white/10 p-5 text-sm text-paper/50">
              No tickets have been sold yet.
            </p>
          ) : null}
          {totalTickets > 0 ? (
            <Link
              href="/admin/tickets?event=all"
              className="focus-ring inline-flex items-center gap-2 rounded-ui border border-white/10 p-4 text-sm font-bold text-paper/62 transition hover:border-paper hover:text-paper"
            >
              <Ticket size={16} />
              See all {totalTickets} tickets across every event
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
      ...(status === "checked-in" ? { checkedInAt: { not: null } } : {}),
      ...(status === "not-checked-in" ? { checkedInAt: null } : {}),
      ...(query
        ? {
            OR: [
              { qrCode: { contains: query, mode: "insensitive" } },
              { attendeeName: { contains: query, mode: "insensitive" } },
              { attendeeEmail: { contains: query, mode: "insensitive" } },
              { event: { title: { contains: query, mode: "insensitive" } } },
              { order: { email: { contains: query, mode: "insensitive" } } },
              { order: { phone: { contains: query, mode: "insensitive" } } },
              { order: { transaction: { reference: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      event: true,
      order: {
        include: {
          transaction: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  const checkedInShown = tickets.filter((ticket) => ticket.checkedInAt).length;

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">At the gate</p>
      <h2 className="mt-2 font-display text-5xl font-black">{selectedEvent ? selectedEvent.title : "All events"}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="max-w-2xl text-sm leading-6 text-paper/58">
          Look up any ticket by name, email, phone, QR code, or payment reference.
        </p>
        <Link
          href="/admin/tickets"
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-ui border border-white/12 px-3 text-xs font-black text-paper/72 transition hover:border-paper hover:text-paper"
        >
          <ArrowLeftRight size={13} />
          Change event
        </Link>
      </div>

      <form className="mt-6 grid gap-3 rounded-ui border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_180px_auto]">
        <input type="hidden" name="event" value={eventParam} />
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/35" size={17} />
          <input
            name="q"
            defaultValue={query}
            className="h-11 w-full rounded-ui border border-white/10 bg-ink pl-10 pr-3 text-sm text-paper"
            placeholder="Search name, email, phone, QR, reference"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
        >
          <option value="all">All tickets</option>
          <option value="checked-in">Checked in</option>
          <option value="not-checked-in">Not checked in</option>
        </select>
        <button className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper">
          Filter
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        <p className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-black uppercase text-paper/62">
          {tickets.length === 150 ? "Latest 150 tickets" : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`} shown
        </p>
        <p className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-black uppercase text-gold">
          {checkedInShown} checked in
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-ui border border-white/10">
        <div className="grid grid-cols-[1.1fr_.9fr_.8fr_.8fr] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase text-paper/45">
          <p>Attendee</p>
          <p>Event</p>
          <p>Status</p>
          <p>Reference</p>
        </div>
        <div className="divide-y divide-white/10">
          {tickets.map((ticket) => {
            const isPaid = ticket.order.status === "PAID" || ticket.order.transaction?.status === "SUCCESS";
            return (
              <div key={ticket.id} className="grid grid-cols-[1.1fr_.9fr_.8fr_.8fr] gap-4 px-4 py-4 text-sm">
                <div>
                  <p className="font-black text-paper">{ticket.attendeeName ?? "Guest"}</p>
                  <p className="mt-1 text-xs text-paper/45">{ticket.attendeeEmail ?? ticket.order.email}</p>
                  <p className="mt-1 text-xs text-paper/45">{ticket.order.phone || "No phone number"}</p>
                  <Link href={`/tickets/${ticket.qrCode}`} target="_blank" className="mt-2 inline-flex text-xs font-black text-gold">
                    Open ticket
                  </Link>
                  <ResendTicketButton ticketId={ticket.id} disabled={!isPaid} />
                </div>
                <div>
                  <p className="font-bold">{ticket.event.title}</p>
                  <p className="mt-1 text-xs text-paper/45">{ticket.event.venue}</p>
                </div>
                <div>
                  <p className={ticket.checkedInAt ? "font-black text-gold" : "font-black text-paper/68"}>
                    {ticket.checkedInAt ? "Checked in" : "Not checked in"}
                  </p>
                  <p className="mt-1 text-xs text-paper/45">{isPaid ? "Paid" : "Payment pending"}</p>
                </div>
                <div>
                  <p className="break-all font-mono text-xs text-paper/62">{ticket.order.transaction?.reference ?? "No reference"}</p>
                  {ticket.checkedInAt ? (
                    <p className="mt-2 text-xs text-paper/45">{new Date(ticket.checkedInAt).toLocaleString()}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {tickets.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No tickets found.</p> : null}
        </div>
      </div>
    </div>
  );
}
