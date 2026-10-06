"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/format-money";

export function AffiliateWithdrawForm({
  availableKobo,
  minimumKobo,
  disabledReason,
}: {
  availableKobo: number;
  minimumKobo: number;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountKobo = Math.round(Number(amount) * 100);
  const isValid = Number.isFinite(amountKobo) && amountKobo >= minimumKobo && amountKobo <= availableKobo;

  async function withdraw(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/affiliate/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountKobo }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);

    setIsSubmitting(false);
    setMessage({ ok: Boolean(response?.ok), text: payload?.message ?? "Unable to withdraw right now." });

    if (response?.ok) setAmount("");
    router.refresh();
  }

  if (disabledReason) {
    return <p className="text-sm leading-6 text-paper/55">{disabledReason}</p>;
  }

  return (
    <form onSubmit={withdraw} className="grid gap-3">
      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          className="h-11 w-full rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
          placeholder="Amount in naira"
          inputMode="decimal"
        />
        <button
          type="button"
          onClick={() => setAmount(String(availableKobo / 100))}
          className="h-11 shrink-0 rounded-ui border border-white/10 px-3 text-xs font-black text-paper/68 hover:border-paper hover:text-paper"
        >
          Max
        </button>
      </div>
      <button
        disabled={!isValid || isSubmitting}
        className="focus-ring h-11 rounded-ui bg-gold px-4 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : isValid ? `Withdraw ${formatNaira(amountKobo)}` : "Withdraw to bank"}
      </button>
      <p className="text-xs text-paper/45">Minimum withdrawal {formatNaira(minimumKobo)}. Paid straight to your saved bank account.</p>
      {message ? (
        <p className={`rounded-ui border p-3 text-sm ${message.ok ? "border-gold/40 bg-gold/10 text-gold" : "border-lava/40 bg-lava/10 text-lava"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
