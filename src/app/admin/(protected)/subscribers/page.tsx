import { SubscriberBroadcastForm } from "@/components/admin/subscriber-broadcast-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Subscribers | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSubscribersPage() {
  const [subscribers, broadcasts] = await Promise.all([
    prisma.waitlistSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.emailBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.isActive);

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">PA FLUX waitlist</p>
      <h2 className="mt-2 font-display text-5xl font-black">Mail subscribers</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/58">
        Everyone who joins the PA FLUX early-access list appears here. Broadcasts are logged with the staff name.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="rounded-ui border border-white/10 bg-white/[0.035]">
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

        <div className="grid h-fit gap-5">
          <SubscriberBroadcastForm subscriberCount={activeSubscribers.length} />
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
