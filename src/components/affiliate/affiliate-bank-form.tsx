"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Bank = { name: string; code: string };

const inputClass = "h-11 w-full rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper";

export function AffiliateBankForm({
  current,
}: {
  current: { bankCode: string; bankName: string; accountNumber: string; accountName: string } | null;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!current);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState(current?.bankCode ?? "");
  const [accountNumber, setAccountNumber] = useState(current?.accountNumber ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing || banks.length > 0) return;

    fetch("/api/affiliate/banks")
      .then((response) => response.json())
      .then((payload) => setBanks(payload.banks ?? []))
      .catch(() => setError("Unable to load the bank list. Refresh and try again."));
  }, [banks.length, isEditing]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/affiliate/bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankCode, accountNumber }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);

    setIsSubmitting(false);

    if (!response?.ok) {
      setError(payload?.message ?? "Unable to save bank details.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (current && !isEditing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-paper">{current.accountName}</p>
          <p className="mt-1 text-sm text-paper/55">
            {current.bankName} · {current.accountNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="focus-ring h-10 rounded-ui border border-white/10 px-3 text-xs font-black text-paper/68 hover:border-paper hover:text-paper"
        >
          Change bank
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="grid gap-3">
      <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={inputClass} required>
        <option value="">{banks.length === 0 ? "Loading banks..." : "Choose your bank"}</option>
        {banks.map((bank) => (
          <option key={bank.code} value={bank.code}>
            {bank.name}
          </option>
        ))}
      </select>
      <input
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
        className={inputClass}
        placeholder="10-digit account number"
        inputMode="numeric"
        required
      />
      {error ? <p className="rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}
      <div className="flex gap-2">
        <button
          disabled={isSubmitting || !bankCode || accountNumber.length !== 10}
          className="focus-ring h-11 rounded-ui bg-gold px-4 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Verifying..." : "Verify and save"}
        </button>
        {current ? (
          <button type="button" onClick={() => setIsEditing(false)} className="h-11 px-3 text-sm font-bold text-paper/55 hover:text-paper">
            Cancel
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-5 text-paper/45">We confirm the account name with your bank before saving it.</p>
    </form>
  );
}
