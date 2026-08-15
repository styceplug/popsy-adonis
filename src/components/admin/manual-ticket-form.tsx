"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Mail, Ticket } from "lucide-react";
import { formatNaira } from "@/lib/format-money";

type IssuableTier = {
  id: string;
  name: string;
  priceKobo: number;
  remaining: number;
  eventTitle: string;
};

type IssuedResult = {
  message: string;
  emailSent: boolean;
  reference: string;
  quantity: number;
  totalKobo: number;
  tickets: Array<{ qrCode: string; attendeeName: string | null }>;
};

type PaymentMethod = "CASH" | "TRANSFER" | "COMPLIMENTARY";

const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string }> = [
  { value: "CASH", label: "Cash", description: "You collected cash at hand" },
  { value: "TRANSFER", label: "Bank transfer", description: "Paid straight to your account" },
  { value: "COMPLIMENTARY", label: "Free ticket", description: "Guest list, no money collected" },
];

const inputStyles = "h-11 w-full rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";

export function ManualTicketForm({ tiers }: { tiers: IssuableTier[] }) {
  const router = useRouter();
  const [ticketTierId, setTicketTierId] = useState(tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [attendeeName, setAttendeeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountNaira, setAmountNaira] = useState("");
  const [note, setNote] = useState("");
  const [joinMailingList, setJoinMailingList] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<IssuedResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tier = useMemo(() => tiers.find((item) => item.id === ticketTierId), [tiers, ticketTierId]);
  const parsedQuantity = Number(quantity) || 0;
  const defaultTotalKobo = tier ? tier.priceKobo * parsedQuantity : 0;
  const expectedTotalKobo =
    paymentMethod === "COMPLIMENTARY" ? 0 : amountNaira.trim() ? Math.round(Number(amountNaira) * 100) : defaultTotalKobo;
  const canSubmit =
    Boolean(tier) && parsedQuantity > 0 && email.trim().length > 3 && !isSubmitting;

  async function issueTicket() {
    setError("");
    setIssued(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/tickets/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTierId,
          quantity: parsedQuantity,
          email,
          attendeeName: attendeeName.trim() || undefined,
          phone: phone.trim() || undefined,
          paymentMethod,
          amountNaira: paymentMethod === "COMPLIMENTARY" || !amountNaira.trim() ? undefined : Number(amountNaira),
          note: note.trim() || undefined,
          joinMailingList,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to issue the ticket.");
      }

      setIssued(payload as IssuedResult);
      setAttendeeName("");
      setEmail("");
      setPhone("");
      setAmountNaira("");
      setNote("");
      setQuantity("1");
      setJoinMailingList(false);
      router.refresh();
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "Unable to issue the ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (tiers.length === 0) {
    return (
      <div className="mt-8 rounded-ui border border-white/10 bg-white/[0.035] p-6 text-sm leading-6 text-paper/58">
        No tickets are on sale right now. Publish an event with an active ticket tier on the{" "}
        <Link href="/admin/events" className="font-black text-gold">
          Events page
        </Link>{" "}
        first.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Which ticket?
            <select
              value={ticketTierId}
              onChange={(event) => setTicketTierId(event.target.value)}
              className={inputStyles}
            >
              {tiers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.eventTitle} - {item.name} ({formatNaira(item.priceKobo)}) · {item.remaining} left
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              How many tickets?
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                type="number"
                min={1}
                max={20}
                className={inputStyles}
              />
              {tier && parsedQuantity > tier.remaining ? (
                <span className="text-xs font-normal leading-5 text-lava">
                  Only {tier.remaining} left in this tier.
                </span>
              ) : null}
            </label>
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Attendee name
              <input
                value={attendeeName}
                onChange={(event) => setAttendeeName(event.target.value)}
                className={inputStyles}
                placeholder="Full name (optional)"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className={inputStyles}
                placeholder="name@email.com"
              />
              <span className="text-xs font-normal leading-5 text-paper/42">The ticket and QR code are sent here.</span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputStyles}
                placeholder="+234... (optional)"
              />
            </label>
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold text-paper/72">How did they pay?</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-ui border p-3 transition ${
                    paymentMethod === method.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="mt-0.5 size-4 shrink-0 accent-gold"
                  />
                  <span>
                    <span className="block text-sm font-black text-paper">{method.label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-paper/48">{method.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {paymentMethod !== "COMPLIMENTARY" ? (
            <label className="grid gap-2 text-sm font-bold text-paper/72">
              Amount collected
              <input
                value={amountNaira}
                onChange={(event) => setAmountNaira(event.target.value)}
                type="number"
                min={0}
                className={inputStyles}
                placeholder={String(defaultTotalKobo / 100)}
              />
              <span className="text-xs font-normal leading-5 text-paper/42">
                Leave empty to record the normal price ({formatNaira(defaultTotalKobo)}). Change it if you gave a discount.
              </span>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-paper/72">
            Note
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputStyles}
              placeholder="e.g. Paid cash to Tunde at the shop (optional)"
            />
            <span className="text-xs font-normal leading-5 text-paper/42">Saved to the activity log with your name.</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-paper/62">
            <input
              type="checkbox"
              checked={joinMailingList}
              onChange={(event) => setJoinMailingList(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-gold"
            />
            Also add this email to the subscription list
          </label>
        </div>

        {error ? <p className="mt-5 rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={issueTicket}
          className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Mail size={17} />
          {isSubmitting
            ? "Issuing ticket..."
            : `Issue ${parsedQuantity || 1} ticket${parsedQuantity === 1 ? "" : "s"} & send email`}
        </button>
      </div>

      <aside className="grid h-fit gap-5">
        <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase text-gold">Summary</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3 text-paper/62">
              <span>Event</span>
              <span className="text-right font-bold text-paper">{tier?.eventTitle ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3 text-paper/62">
              <span>Tier</span>
              <span className="text-right font-bold text-paper">{tier?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3 text-paper/62">
              <span>Tickets</span>
              <span className="font-bold text-paper">{parsedQuantity || 0}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3 text-base font-black">
              <span>Recorded as</span>
              <span className="text-gold">{formatNaira(expectedTotalKobo)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-paper/42">
            This creates a real, scannable ticket exactly like an online purchase, and counts towards the tier&apos;s sold total.
          </p>
        </div>

        {issued ? (
          <div
            className={`rounded-ui border p-5 ${
              issued.emailSent ? "border-gold/35 bg-gold/10" : "border-lava/40 bg-lava/10"
            }`}
          >
            <p className={`inline-flex items-start gap-2 font-black ${issued.emailSent ? "text-gold" : "text-lava"}`}>
              {issued.emailSent ? (
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              ) : (
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              )}
              {issued.message}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-paper/58">{issued.reference}</p>
            <div className="mt-4 grid gap-2">
              {issued.tickets.map((ticket, index) => (
                <Link
                  key={ticket.qrCode}
                  href={`/tickets/${ticket.qrCode}`}
                  target="_blank"
                  className="focus-ring inline-flex items-center gap-2 rounded-ui border border-white/12 bg-ink/40 px-3 py-2.5 text-xs font-black text-paper/72 transition hover:border-gold hover:text-gold"
                >
                  <Ticket size={14} />
                  Open ticket {index + 1}
                  {ticket.attendeeName ? ` · ${ticket.attendeeName}` : ""}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-paper/48">
              If the email does not arrive, open the ticket above and show the QR code, or resend it from the Tickets page.
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
