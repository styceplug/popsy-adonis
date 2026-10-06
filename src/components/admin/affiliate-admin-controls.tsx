"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const smallButton =
  "focus-ring h-9 rounded-ui px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  const payload = await response?.json().catch(() => null);

  return { ok: Boolean(response?.ok), payload };
}

export function AffiliateStatusButton({ affiliateId, status }: { affiliateId: string; status: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextStatus = status === "APPROVED" ? "SUSPENDED" : "APPROVED";

  async function update() {
    setIsSubmitting(true);
    setError("");
    const result = await post(`/api/admin/affiliates/${affiliateId}`, { status: nextStatus });
    setIsSubmitting(false);
    if (!result.ok) return setError(result.payload?.message ?? "Unable to update.");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={update}
        className={`${smallButton} ${
          nextStatus === "APPROVED" ? "bg-gold text-ink hover:bg-paper" : "border border-white/12 text-paper/68 hover:border-lava hover:text-lava"
        }`}
      >
        {isSubmitting ? "Saving..." : status === "APPROVED" ? "Suspend" : status === "SUSPENDED" ? "Reinstate" : "Approve"}
      </button>
      {error ? <p className="mt-1 text-xs text-lava">{error}</p> : null}
    </div>
  );
}

/** Saves a percentage. Used for an event's rate and for an affiliate's personal rate. */
export function CommissionRateForm({
  url,
  body,
  initialPercent,
  allowEmpty,
}: {
  url: string;
  body: Record<string, string>;
  initialPercent: number | null;
  allowEmpty?: boolean;
}) {
  const router = useRouter();
  const [percent, setPercent] = useState(initialPercent === null ? "" : String(initialPercent));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const value = percent.trim() === "" ? null : Number(percent);
    const result = await post(
      url,
      allowEmpty ? { ...body, commissionPercentOverride: value } : { ...body, percent: value ?? 0 },
    );

    setIsSubmitting(false);
    setMessage(result.ok ? "Saved" : (result.payload?.message ?? "Unable to save."));
    if (result.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label className="relative">
        <input
          value={percent}
          onChange={(e) => setPercent(e.target.value.replace(/[^\d.]/g, ""))}
          className="h-9 w-24 rounded-ui border border-white/10 bg-ink pl-3 pr-7 text-sm text-paper"
          placeholder={allowEmpty ? "Event" : "0"}
          inputMode="decimal"
          aria-label="Commission percent"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-paper/45">%</span>
      </label>
      <button disabled={isSubmitting} className={`${smallButton} border border-white/12 text-paper/68 hover:border-gold hover:text-gold`}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
      {message ? <p className="text-xs font-bold text-paper/50">{message}</p> : null}
    </form>
  );
}

export function RecheckWithdrawalButton({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function recheck() {
    setIsSubmitting(true);
    setMessage("");
    const result = await post(`/api/admin/affiliates/withdrawals/${withdrawalId}/recheck`);
    setIsSubmitting(false);
    setMessage(result.ok ? `Paystack says: ${result.payload?.paystackStatus}` : (result.payload?.message ?? "Unable to recheck."));
    if (result.ok) router.refresh();
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={recheck}
        className={`${smallButton} border border-white/12 text-paper/68 hover:border-gold hover:text-gold`}
      >
        {isSubmitting ? "Checking..." : "Recheck with Paystack"}
      </button>
      {message ? <p className="mt-1 text-xs font-bold text-paper/50">{message}</p> : null}
    </div>
  );
}
