import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Tickets | Popsy Adonis Admin",
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "all";

  const tickets = await prisma.ticket.findMany({
    where: {
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

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Ticket records</p>
      <h2 className="mt-2 font-display text-5xl font-black">All tickets</h2>
      <form className="mt-6 grid gap-3 rounded-ui border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_180px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/35" size={17} />
          <input
            name="q"
            defaultValue={query}
            className="h-11 w-full rounded-ui border border-white/10 bg-ink pl-10 pr-3 text-sm text-paper"
            placeholder="Search name, email, QR, reference, event"
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

      <div className="mt-6 overflow-hidden rounded-ui border border-white/10">
        <div className="grid grid-cols-[1.1fr_.9fr_.8fr_.8fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
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
                  <Link href={`/tickets/${ticket.qrCode}`} target="_blank" className="mt-2 inline-flex text-xs font-black text-gold">
                    Open ticket
                  </Link>
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
