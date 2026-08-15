import { SubscriberBroadcastForm } from "@/components/admin/subscriber-broadcast-form";
import { prisma } from "@/lib/prisma";
import { getTicketBuyers } from "@/lib/ticket-buyers";

export const metadata = {
  title: "Subscribers | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSubscribersPage() {
  const [subscribers, broadcasts, ticketBuyers] = await Promise.all([
    prisma.waitlistSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.emailBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getTicketBuyers(),
  ]);
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.isActive);
  const subscriberEmails = new Set(activeSubscribers.map((subscriber) => subscriber.email.trim().toLowerCase()));

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">People</p>
      <h2 className="mt-2 font-display text-5xl font-black">Subscribers</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/58">
        Two mailing lists live here: people who joined the subscription list, and everyone who has bought a ticket.
        Pick who to email when you send a broadcast.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="grid h-fit gap-5">
          <div className="rounded-ui border border-white/10 bg-white/[0.035]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <p className="text-xs font-black uppercase text-gold">Subscription list</p>
              <p className="text-xs font-black uppercase text-paper/45">{activeSubscribers.length} active</p>
            </div>
            <div className="grid grid-cols-[1fr_.55fr_.7fr] gap-4 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-paper/45">
              <p>Email</p>
              <p>Source</p>
              <p>Joined</p>
            </div>
            <div className="divide-y divide-white/10">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="grid grid-cols-[1fr_.55fr_.7fr] gap-4 px-4 py-4 text-sm">
                  <div>
                    <p className="break-all font-black text-paper">{subscriber.email}</p>
                    <p className={subscriber.isActive ? "mt-1 text-xs text-gold" : "mt-1 text-xs text-paper/35"}>
                      {subscriber.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <p className="text-paper/62">{subscriber.source}</p>
                  <p className="text-xs text-paper/45">{new Date(subscriber.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {subscribers.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No subscribers yet.</p> : null}
            </div>
          </div>

          <div className="rounded-ui border border-white/10 bg-white/[0.035]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <p className="text-xs font-black uppercase text-gold">Ticket buyers</p>
              <p className="text-xs font-black uppercase text-paper/45">{ticketBuyers.length} emails</p>
            </div>
            <p className="border-b border-white/10 px-4 py-3 text-xs leading-5 text-paper/45">
              Everyone who has paid for a ticket, collected automatically from orders. Always up to date - nothing to import.
            </p>
            <div className="grid grid-cols-[1fr_.45fr_.7fr] gap-4 border-b border-white/10 px-4 py-3 text-xs font-black uppercase text-paper/45">
              <p>Email</p>
              <p>Orders</p>
              <p>Last purchase</p>
            </div>
            <div className="divide-y divide-white/10">
              {ticketBuyers.map((buyer) => (
                <div key={buyer.email} className="grid grid-cols-[1fr_.45fr_.7fr] gap-4 px-4 py-4 text-sm">
                  <div>
                    <p className="break-all font-black text-paper">{buyer.email}</p>
                    {subscriberEmails.has(buyer.email) ? (
                      <p className="mt-1 text-xs text-gold">Also subscribed</p>
                    ) : null}
                  </div>
                  <p className="text-paper/62">{buyer.orderCount}</p>
                  <p className="text-xs text-paper/45">{new Date(buyer.lastPurchaseAt).toLocaleDateString()}</p>
                </div>
              ))}
              {ticketBuyers.length === 0 ? (
                <p className="px-4 py-6 text-sm text-paper/50">No ticket purchases yet.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid h-fit gap-5">
          <SubscriberBroadcastForm subscriberCount={activeSubscribers.length} buyerCount={ticketBuyers.length} />
          <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-black uppercase text-gold">Recent broadcasts</p>
            <div className="mt-4 grid gap-3">
              {broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="rounded-ui border border-white/10 p-3">
                  <p className="font-black text-paper">{broadcast.subject}</p>
                  <p className="mt-1 text-xs text-paper/45">
                    {broadcast.sentCount}/{broadcast.recipientCount} sent by {broadcast.actorName}
                  </p>
                  <p className="mt-1 text-xs text-paper/35">{new Date(broadcast.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {broadcasts.length === 0 ? <p className="text-sm text-paper/50">No broadcasts sent yet.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
