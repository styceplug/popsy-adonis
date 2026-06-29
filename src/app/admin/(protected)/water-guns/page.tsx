import { Search } from "lucide-react";
import { CollectWaterGunButton } from "@/components/admin/collect-water-gun-button";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Water Guns | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWaterGunsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "all";

  const redemptions = await prisma.eventAddOnRedemption.findMany({
    where: {
      ...(status === "collected" ? { collectedAt: { not: null } } : {}),
      ...(status === "not-collected" ? { collectedAt: null } : {}),
      ...(query
        ? {
            OR: [
              { customerEmail: { contains: query, mode: "insensitive" } },
              { customerPhone: { contains: query, mode: "insensitive" } },
              { customerName: { contains: query, mode: "insensitive" } },
              { eventAddOn: { name: { contains: query, mode: "insensitive" } } },
              { order: { transaction: { reference: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      eventAddOn: {
        include: {
          event: {
            select: {
              title: true,
            },
          },
        },
      },
      order: {
        include: {
          transaction: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Add-on collection</p>
      <h2 className="mt-2 font-display text-5xl font-black">Water guns</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        Paid water gun add-ons appear here after Paystack confirmation. Mark them collected when the buyer receives them.
      </p>

      <form className="mt-6 grid gap-3 rounded-ui border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_190px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/35" size={17} />
          <input
            name="q"
            defaultValue={query}
            className="h-11 w-full rounded-ui border border-white/10 bg-ink pl-10 pr-3 text-sm text-paper"
            placeholder="Search email, phone, reference, water gun"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
        >
          <option value="all">All water guns</option>
          <option value="collected">Collected</option>
          <option value="not-collected">Not collected</option>
        </select>
        <button className="focus-ring h-11 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper">
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-ui border border-white/10">
        <div className="grid grid-cols-[1fr_.8fr_.45fr_.7fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
          <p>Buyer</p>
          <p>Add-on</p>
          <p>Qty purchased</p>
          <p>Payment</p>
          <p>Status</p>
        </div>
        <div className="divide-y divide-white/10">
          {redemptions.map((redemption) => {
            const isPaid = redemption.order.status === "PAID" || redemption.order.transaction?.status === "SUCCESS";

            return (
              <div key={redemption.id} className="grid grid-cols-[1fr_.8fr_.45fr_.7fr_.7fr] gap-4 px-4 py-4 text-sm">
                <div>
                  <p className="font-black text-paper">{redemption.customerName ?? "Guest"}</p>
                  <p className="mt-1 text-xs text-paper/45">{redemption.customerEmail}</p>
                  <p className="mt-1 text-xs text-paper/45">{redemption.customerPhone || "No phone number"}</p>
                </div>
                <div>
                  <p className="font-black text-paper">{redemption.eventAddOn.name}</p>
                  <p className="mt-1 text-xs text-paper/45">{redemption.eventAddOn.event.title}</p>
                  <p className="mt-1 text-xs text-paper/45">
                    {formatNaira(redemption.eventAddOn.priceKobo * redemption.quantity)}
                  </p>
                </div>
                <div>
                  <p className="font-display text-3xl font-black text-paper">{redemption.quantity}</p>
                  <p className="mt-1 text-xs text-paper/45">unit{redemption.quantity === 1 ? "" : "s"}</p>
                </div>
                <div>
                  <p className={isPaid ? "font-black text-gold" : "font-black text-paper/50"}>{isPaid ? "Paid" : "Pending"}</p>
                  <p className="mt-1 break-all font-mono text-xs text-paper/45">
                    {redemption.order.transaction?.reference ?? "No reference"}
                  </p>
                </div>
                <div>
                  <p className={redemption.collectedAt ? "font-black text-gold" : "font-black text-paper/68"}>
                    {redemption.collectedAt ? "Collected" : "Not collected"}
                  </p>
                  {redemption.collectedAt ? (
                    <p className="mt-1 text-xs text-paper/45">
                      {new Date(redemption.collectedAt).toLocaleString()} by {redemption.collectedBy ?? "Admin"}
                    </p>
                  ) : (
                    <CollectWaterGunButton redemptionId={redemption.id} disabled={!isPaid} />
                  )}
                </div>
              </div>
            );
          })}
          {redemptions.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No water gun purchases found.</p> : null}
        </div>
      </div>
    </div>
  );
}
