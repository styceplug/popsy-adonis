import { AffiliateBankForm } from "@/components/affiliate/affiliate-bank-form";
import { AffiliateLogoutButton } from "@/components/affiliate/affiliate-logout-button";
import { AffiliateWithdrawForm } from "@/components/affiliate/affiliate-withdraw-form";
import { CopyLinkButton } from "@/components/affiliate/copy-link-button";
import { requireAffiliate } from "@/lib/affiliate-auth";
import {
  buildAffiliateLink,
  formatBps,
  getAffiliateBalance,
  getEffectiveCommissionBps,
  getMinimumWithdrawalKobo,
  maskEmail,
} from "@/lib/affiliates";
import { getEventDisplayDate } from "@/lib/event-display";
import { formatNaira } from "@/lib/format-money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string) {
  if (typeof value === "string") return value;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(value);
}

const withdrawalLabels = {
  PROCESSING: { text: "On its way", className: "text-paper/68" },
  PAID: { text: "Paid", className: "text-gold" },
  FAILED: { text: "Not sent", className: "text-lava" },
} as const;

export default async function AffiliateDashboardPage() {
  const affiliate = await requireAffiliate();
  const now = new Date();
  // Keep an event listed until roughly the morning after it starts.
  const stillSellingSince = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const [balance, events, salesByEvent, linkStats, recentSales, withdrawals] = await Promise.all([
    getAffiliateBalance(affiliate.id),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        ticketTiers: { some: { isActive: true } },
        OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: stillSellingSince } }],
      },
      include: { ticketTiers: { where: { isActive: true }, orderBy: { priceKobo: "asc" } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.affiliateCommission.groupBy({
      by: ["eventId"],
      where: { affiliateId: affiliate.id, status: "EARNED" },
      _sum: { ticketCount: true, amountKobo: true },
    }),
    prisma.affiliateLinkStat.findMany({ where: { affiliateId: affiliate.id } }),
    prisma.affiliateCommission.findMany({
      where: { affiliateId: affiliate.id, status: "EARNED" },
      include: { event: { select: { title: true } }, order: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.affiliateWithdrawal.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const salesMap = new Map(salesByEvent.map((row) => [row.eventId, row._sum]));
  const clicksMap = new Map(linkStats.map((row) => [row.eventId, row.clicks]));
  const isApproved = affiliate.status === "APPROVED";
  const minimumKobo = getMinimumWithdrawalKobo();
  const bank =
    affiliate.bankCode && affiliate.bankName && affiliate.accountNumber && affiliate.accountName
      ? {
          bankCode: affiliate.bankCode,
          bankName: affiliate.bankName,
          accountNumber: affiliate.accountNumber,
          accountName: affiliate.accountName,
        }
      : null;

  const withdrawDisabledReason = !isApproved
    ? "Withdrawals open once your account is approved."
    : !bank
      ? "Add your bank details first."
      : balance.processingKobo > 0
        ? "You have a withdrawal on its way. You can request another once it lands."
        : balance.availableKobo < minimumKobo
          ? `You can withdraw once your balance reaches ${formatNaira(minimumKobo)}.`
          : undefined;

  const stats = [
    { label: "Available balance", value: formatNaira(balance.availableKobo), highlight: true },
    { label: "Total earned", value: formatNaira(balance.earnedKobo) },
    { label: "Tickets sold", value: String(balance.ticketsSold) },
    { label: "Sales value", value: formatNaira(balance.salesKobo) },
  ];

  return (
    <div className="section-shell py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-black uppercase text-gold">Popsy Adonis Affiliates</p>
          <h1 className="mt-1 font-display text-3xl font-black">Hi, {affiliate.fullName.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="rounded-ui border border-white/10 px-3 py-2 text-sm text-paper/68">
            Code: <span className="font-mono font-black text-paper">{affiliate.code}</span>
          </p>
          <AffiliateLogoutButton />
        </div>
      </header>

      {affiliate.status === "PENDING" ? (
        <p className="mt-6 rounded-ui border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-gold">
          Your account is waiting for approval. Your links start earning as soon as the team approves you.
        </p>
      ) : null}
      {affiliate.status === "SUSPENDED" ? (
        <p className="mt-6 rounded-ui border border-lava/40 bg-lava/10 p-4 text-sm leading-6 text-lava">
          Your affiliate account is suspended. Your links are not earning right now. Contact the Popsy Adonis team.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-ui border p-4 ${stat.highlight ? "border-gold/30 bg-gold/10" : "border-white/10 bg-white/[0.035]"}`}
          >
            <p className="text-xs font-black uppercase text-paper/45">{stat.label}</p>
            <p className={`mt-2 font-display text-3xl font-black ${stat.highlight ? "text-gold" : "text-paper"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-black">Tickets on sale</h2>
          <p className="mt-2 text-sm leading-6 text-paper/55">
            Copy your link for an event and share it. Anyone who buys a ticket after opening it counts as your sale.
          </p>
          <div className="mt-4 grid gap-3">
            {events.map((event) => {
              const rateBps = getEffectiveCommissionBps(event.affiliateCommissionBps, affiliate.commissionBpsOverride);
              const link = buildAffiliateLink(event.slug, affiliate.code);
              const sold = salesMap.get(event.id);
              const prices = event.ticketTiers.map((tier) => tier.priceKobo);
              const fromPrice = Math.min(...prices);

              return (
                <div key={event.id} className="rounded-ui border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-black">{event.title}</h3>
                      <p className="mt-1 text-xs text-paper/50">
                        {formatDate(getEventDisplayDate(event))} · {event.venue}
                      </p>
                    </div>
                    <p className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-black uppercase text-gold">
                      {rateBps > 0 ? `${formatBps(rateBps)} per ticket` : "Commission not set yet"}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-paper/62">
                    Tickets from {formatNaira(fromPrice)}
                    {rateBps > 0 ? `, you earn from ${formatNaira(Math.round((fromPrice * rateBps) / 10_000))} each` : ""}
                  </p>
                  {isApproved ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <p className="min-w-0 flex-1 truncate rounded-ui border border-white/10 bg-ink px-3 py-2.5 font-mono text-xs text-paper/68">
                        {link}
                      </p>
                      <CopyLinkButton link={link} />
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs font-bold text-paper/45">
                    {clicksMap.get(event.id) ?? 0} clicks · {sold?.ticketCount ?? 0} tickets sold · {formatNaira(sold?.amountKobo ?? 0)} earned
                  </p>
                </div>
              );
            })}
            {events.length === 0 ? (
              <p className="rounded-ui border border-white/10 bg-white/[0.035] p-5 text-sm text-paper/55">
                No tickets are on sale right now. New events will show up here.
              </p>
            ) : null}
          </div>

          <h2 className="mt-10 font-display text-2xl font-black">Your sales</h2>
          <div className="mt-4 overflow-x-auto rounded-ui border border-white/10">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.2fr_1fr_.4fr_.6fr] gap-4 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase text-paper/45">
                <p>Event</p>
                <p>Buyer</p>
                <p>Tickets</p>
                <p>You earned</p>
              </div>
              <div className="divide-y divide-white/10">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="grid grid-cols-[1.2fr_1fr_.4fr_.6fr] gap-4 px-4 py-3 text-sm">
                    <div>
                      <p className="font-black text-paper">{sale.event.title}</p>
                      <p className="mt-1 text-xs text-paper/45">{formatDate(sale.earnedAt ?? sale.createdAt)}</p>
                    </div>
                    <p className="break-all text-paper/62">{maskEmail(sale.order.email)}</p>
                    <p className="font-black text-paper">{sale.ticketCount}</p>
                    <div>
                      <p className="font-black text-gold">{formatNaira(sale.amountKobo)}</p>
                      <p className="mt-1 text-xs text-paper/45">{formatBps(sale.rateBps)} of {formatNaira(sale.ticketSubtotalKobo)}</p>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-paper/50">No sales yet. Share a link to get started.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="grid h-fit gap-4">
          <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-black uppercase text-gold">Withdraw</p>
            <p className="mt-2 font-display text-4xl font-black">{formatNaira(balance.availableKobo)}</p>
            <p className="mt-1 text-xs text-paper/45">
              {formatNaira(balance.paidKobo)} paid out so far
              {balance.processingKobo > 0 ? ` · ${formatNaira(balance.processingKobo)} on its way` : ""}
            </p>
            <div className="mt-4">
              <AffiliateWithdrawForm
                availableKobo={balance.availableKobo}
                minimumKobo={minimumKobo}
                disabledReason={withdrawDisabledReason}
              />
            </div>
          </div>

          <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-black uppercase text-gold">Payout bank account</p>
            <div className="mt-4">
              <AffiliateBankForm current={bank} />
            </div>
          </div>

          <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs font-black uppercase text-gold">Withdrawal history</p>
            <div className="mt-3 divide-y divide-white/10">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-black text-paper">{formatNaira(withdrawal.amountKobo)}</p>
                    <p className="mt-1 text-xs text-paper/45">
                      {formatDate(withdrawal.createdAt)} · {withdrawal.bankName}
                    </p>
                  </div>
                  <p className={`text-xs font-black uppercase ${withdrawalLabels[withdrawal.status].className}`}>
                    {withdrawalLabels[withdrawal.status].text}
                  </p>
                </div>
              ))}
              {withdrawals.length === 0 ? <p className="py-3 text-sm text-paper/50">No withdrawals yet.</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
