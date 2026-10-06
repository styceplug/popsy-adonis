import {
  AffiliateStatusButton,
  CommissionRateForm,
  RecheckWithdrawalButton,
} from "@/components/admin/affiliate-admin-controls";
import { formatBps } from "@/lib/affiliates";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Affiliates | Popsy Adonis Admin",
  robots: { index: false, follow: false },
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(value);
}

const statusClass: Record<string, string> = {
  PENDING: "text-paper/68",
  APPROVED: "text-gold",
  SUSPENDED: "text-lava",
  PROCESSING: "text-paper/68",
  PAID: "text-gold",
  FAILED: "text-lava",
};

export default async function AdminAffiliatesPage() {
  const [affiliates, events, earnedByAffiliate, withdrawalsByAffiliate, recentSales, withdrawals] = await Promise.all([
    prisma.affiliate.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "SOLD_OUT"] } },
      select: { id: true, title: true, startsAt: true, affiliateCommissionBps: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.affiliateCommission.groupBy({
      by: ["affiliateId"],
      where: { status: "EARNED" },
      _sum: { amountKobo: true, ticketSubtotalKobo: true, ticketCount: true },
    }),
    prisma.affiliateWithdrawal.groupBy({
      by: ["affiliateId", "status"],
      _sum: { amountKobo: true },
    }),
    prisma.affiliateCommission.findMany({
      where: { status: "EARNED" },
      include: {
        affiliate: { select: { fullName: true, code: true } },
        event: { select: { title: true } },
        order: { select: { email: true, transaction: { select: { reference: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.affiliateWithdrawal.findMany({
      include: { affiliate: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const earnedMap = new Map(earnedByAffiliate.map((row) => [row.affiliateId, row._sum]));
  const withdrawnMap = new Map<string, { paid: number; processing: number }>();
  for (const row of withdrawalsByAffiliate) {
    const entry = withdrawnMap.get(row.affiliateId) ?? { paid: 0, processing: 0 };
    if (row.status === "PAID") entry.paid += row._sum.amountKobo ?? 0;
    if (row.status === "PROCESSING") entry.processing += row._sum.amountKobo ?? 0;
    withdrawnMap.set(row.affiliateId, entry);
  }

  const totalEarned = earnedByAffiliate.reduce((sum, row) => sum + (row._sum.amountKobo ?? 0), 0);
  const totalSales = earnedByAffiliate.reduce((sum, row) => sum + (row._sum.ticketSubtotalKobo ?? 0), 0);
  const totalTickets = earnedByAffiliate.reduce((sum, row) => sum + (row._sum.ticketCount ?? 0), 0);
  const totalPaid = [...withdrawnMap.values()].reduce((sum, row) => sum + row.paid, 0);
  const totalProcessing = [...withdrawnMap.values()].reduce((sum, row) => sum + row.processing, 0);
  const pendingCount = affiliates.filter((affiliate) => affiliate.status === "PENDING").length;

  const stats = [
    { label: "Affiliate ticket sales", value: formatNaira(totalSales), hint: `${totalTickets} tickets` },
    { label: "Commission earned", value: formatNaira(totalEarned), hint: "Across all affiliates" },
    { label: "Paid out", value: formatNaira(totalPaid), hint: totalProcessing > 0 ? `${formatNaira(totalProcessing)} in transit` : "Sent to banks" },
    { label: "Still owed", value: formatNaira(Math.max(totalEarned - totalPaid - totalProcessing, 0)), hint: "Keep this in the Paystack balance" },
  ];

  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">People</p>
      <h2 className="mt-2 font-display text-5xl font-black">Affiliates</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/58">
        People who sell tickets through their own links. Commission comes out of Adonis ticket revenue and is paid from the
        Paystack balance when an affiliate withdraws.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-ui border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase text-paper/45">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-black">{stat.value}</p>
            <p className="mt-1 text-xs text-paper/45">{stat.hint}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-10 font-display text-2xl font-black">Commission per event</h3>
      <p className="mt-2 text-sm text-paper/55">The share of each ticket an affiliate earns. Set 0 to turn commission off for an event.</p>
      <div className="mt-4 divide-y divide-white/10 rounded-ui border border-white/10">
        {events.map((event) => (
          <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-black text-paper">{event.title}</p>
              <p className="mt-1 text-xs text-paper/45">{formatDate(event.startsAt)}</p>
            </div>
            <CommissionRateForm
              url="/api/admin/affiliates/event-rate"
              body={{ eventId: event.id }}
              initialPercent={event.affiliateCommissionBps / 100}
            />
          </div>
        ))}
        {events.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No published events.</p> : null}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-2xl font-black">Affiliates</h3>
        {pendingCount > 0 ? (
          <p className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-black uppercase text-gold">
            {pendingCount} waiting for approval
          </p>
        ) : null}
      </div>
      <div className="mt-4 overflow-x-auto rounded-ui border border-white/10">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.3fr_.7fr_.8fr_.8fr_1fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
            <p>Affiliate</p>
            <p>Sales</p>
            <p>Earned</p>
            <p>Balance</p>
            <p>Personal rate</p>
            <p>Status</p>
          </div>
          <div className="divide-y divide-white/10">
            {affiliates.map((affiliate) => {
              const earned = earnedMap.get(affiliate.id);
              const withdrawn = withdrawnMap.get(affiliate.id) ?? { paid: 0, processing: 0 };
              const earnedKobo = earned?.amountKobo ?? 0;

              return (
                <div key={affiliate.id} className="grid grid-cols-[1.3fr_.7fr_.8fr_.8fr_1fr_.7fr] gap-4 px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-black text-paper">{affiliate.fullName}</p>
                    <p className="mt-1 break-all text-xs text-paper/45">{affiliate.email}</p>
                    <p className="mt-1 text-xs text-paper/45">{affiliate.phone ?? "No phone"}</p>
                    <p className="mt-1 font-mono text-xs text-paper/62">{affiliate.code}</p>
                    <p className="mt-1 text-xs text-paper/45">
                      {affiliate.accountName ? `${affiliate.accountName} · ${affiliate.bankName} · ${affiliate.accountNumber}` : "No bank details yet"}
                    </p>
                  </div>
                  <div>
                    <p className="font-black text-paper">{earned?.ticketCount ?? 0} tickets</p>
                    <p className="mt-1 text-xs text-paper/45">{formatNaira(earned?.ticketSubtotalKobo ?? 0)}</p>
                  </div>
                  <div>
                    <p className="font-black text-gold">{formatNaira(earnedKobo)}</p>
                    <p className="mt-1 text-xs text-paper/45">{formatNaira(withdrawn.paid)} paid out</p>
                  </div>
                  <div>
                    <p className="font-black text-paper">
                      {formatNaira(Math.max(earnedKobo - withdrawn.paid - withdrawn.processing, 0))}
                    </p>
                    {withdrawn.processing > 0 ? (
                      <p className="mt-1 text-xs text-paper/45">{formatNaira(withdrawn.processing)} in transit</p>
                    ) : null}
                  </div>
                  <div>
                    <CommissionRateForm
                      url={`/api/admin/affiliates/${affiliate.id}`}
                      body={{}}
                      initialPercent={affiliate.commissionBpsOverride === null ? null : affiliate.commissionBpsOverride / 100}
                      allowEmpty
                    />
                    <p className="mt-1 text-xs text-paper/45">Leave empty to use each event&apos;s rate.</p>
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase ${statusClass[affiliate.status]}`}>{affiliate.status}</p>
                    <p className="mt-1 text-xs text-paper/45">Joined {formatDate(affiliate.createdAt)}</p>
                    <div className="mt-2">
                      <AffiliateStatusButton affiliateId={affiliate.id} status={affiliate.status} />
                    </div>
                  </div>
                </div>
              );
            })}
            {affiliates.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No affiliates have signed up yet.</p> : null}
          </div>
        </div>
      </div>

      <h3 className="mt-10 font-display text-2xl font-black">Recent affiliate sales</h3>
      <div className="mt-4 overflow-x-auto rounded-ui border border-white/10">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1fr_1fr_1.1fr_.4fr_.7fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
            <p>Affiliate</p>
            <p>Event</p>
            <p>Buyer</p>
            <p>Tickets</p>
            <p>Commission</p>
          </div>
          <div className="divide-y divide-white/10">
            {recentSales.map((sale) => (
              <div key={sale.id} className="grid grid-cols-[1fr_1fr_1.1fr_.4fr_.7fr] gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-black text-paper">{sale.affiliate.fullName}</p>
                  <p className="mt-1 font-mono text-xs text-paper/45">{sale.affiliate.code}</p>
                </div>
                <div>
                  <p className="text-paper">{sale.event.title}</p>
                  <p className="mt-1 text-xs text-paper/45">{formatDate(sale.earnedAt ?? sale.createdAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="break-all text-paper/72">{sale.order.email}</p>
                  <p className="mt-1 break-all font-mono text-xs text-paper/45">{sale.order.transaction?.reference ?? "No reference"}</p>
                </div>
                <p className="font-black text-paper">{sale.ticketCount}</p>
                <div>
                  <p className="font-black text-gold">{formatNaira(sale.amountKobo)}</p>
                  <p className="mt-1 text-xs text-paper/45">{formatBps(sale.rateBps)} of {formatNaira(sale.ticketSubtotalKobo)}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No affiliate sales yet.</p> : null}
          </div>
        </div>
      </div>

      <h3 className="mt-10 font-display text-2xl font-black">Withdrawals</h3>
      <p className="mt-2 text-sm text-paper/55">Sent automatically through Paystack when an affiliate asks. Nothing here needs approval.</p>
      <div className="mt-4 overflow-x-auto rounded-ui border border-white/10">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1fr_.6fr_1.2fr_1fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
            <p>Affiliate</p>
            <p>Amount</p>
            <p>Sent to</p>
            <p>Status</p>
          </div>
          <div className="divide-y divide-white/10">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="grid grid-cols-[1fr_.6fr_1.2fr_1fr] gap-4 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-black text-paper">{withdrawal.affiliate.fullName}</p>
                  <p className="mt-1 break-all text-xs text-paper/45">{withdrawal.affiliate.email}</p>
                </div>
                <p className="font-black text-paper">{formatNaira(withdrawal.amountKobo)}</p>
                <div className="min-w-0">
                  <p className="text-paper/72">{withdrawal.accountName}</p>
                  <p className="mt-1 text-xs text-paper/45">
                    {withdrawal.bankName} · {withdrawal.accountNumber}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-paper/45">{withdrawal.reference}</p>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase ${statusClass[withdrawal.status]}`}>{withdrawal.status}</p>
                  <p className="mt-1 text-xs text-paper/45">{formatDate(withdrawal.paidAt ?? withdrawal.createdAt)}</p>
                  {withdrawal.failureReason ? <p className="mt-1 text-xs text-lava">{withdrawal.failureReason}</p> : null}
                  {withdrawal.status === "PROCESSING" ? <RecheckWithdrawalButton withdrawalId={withdrawal.id} /> : null}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 ? <p className="px-4 py-6 text-sm text-paper/50">No withdrawals yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
