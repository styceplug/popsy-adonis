import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function TicketPage({ params }: { params: Promise<{ qrCode: string }> }) {
  const { qrCode } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    include: {
      event: true,
      order: {
        include: {
          transaction: true,
        },
      },
    },
  });

  if (!ticket) notFound();

  const date = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(ticket.event.startsAt);
  const isPaid = ticket.order.status === "PAID" || ticket.order.transaction?.status === "SUCCESS";
  const hasCheckedIn = Boolean(ticket.checkedInAt);

  return (
    <main className="min-h-screen bg-ink pt-28 text-paper">
      <section className="section-shell pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-xs font-black uppercase text-gold">Popsy Adonis ticket</p>
            <h1 className="display-title mt-4 max-w-4xl text-6xl md:text-8xl">{ticket.event.title}</h1>
            <div className="mt-6 grid gap-3 text-paper/68">
              <p className="inline-flex items-center gap-2">
                <Clock3 size={17} />
                {date}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin size={17} />
                {ticket.event.venue}, {ticket.event.city}
              </p>
              <p className="inline-flex items-center gap-2">
                <ShieldCheck size={17} />
                {ticket.attendeeName ?? "Guest"}
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase text-gold">Payment</p>
                <p className="mt-2 text-2xl font-black">{isPaid ? "Confirmed" : "Pending"}</p>
              </div>
              <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase text-gold">Gate status</p>
                <p className="mt-2 text-2xl font-black">{hasCheckedIn ? "Checked in" : "Not checked in"}</p>
              </div>
            </div>

            <p className="mt-8 max-w-2xl text-sm leading-6 text-paper/52">
              This page is opened by scanning the ticket QR code. Gate staff should validate this ticket before entry.
            </p>
          </div>

          <aside className="h-fit rounded-ui border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-24">
            <div className="rounded-ui bg-paper p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ticket.qrImageUrl ?? ""} alt="Ticket QR code" className="h-auto w-full rounded-ui" />
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-ui border border-gold/30 bg-gold/10 p-4">
              <CheckCircle2 className="mt-0.5 text-gold" size={19} />
              <div>
                <p className="text-sm font-black text-gold">Live ticket</p>
                <p className="mt-1 text-xs leading-5 text-paper/60">Reference: {ticket.order.transaction?.reference}</p>
              </div>
            </div>
            <div className="mt-5 rounded-ui border border-white/10 p-4">
              <p className="text-xs font-black uppercase text-paper/42">Ticket code</p>
              <p className="mt-2 break-all font-mono text-xs text-paper/72">{ticket.qrCode}</p>
            </div>
            <Link
              href="/events"
              className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center rounded-ui bg-gold px-4 text-sm font-black text-ink hover:bg-paper"
            >
              View events
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

