"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { merchStatusOptions } from "@/lib/merch-status";

export function MerchOrderStatusForm({
  orderId,
  status,
  note,
}: {
  orderId: string;
  status: string;
  note: string;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(status);
  const [nextNote, setNextNote] = useState(note);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/merch-orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, note: nextNote, notifyCustomer }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setIsSaving(false);
    if (!response?.ok) {
      setMessage(payload?.message ?? "Unable to save.");
      return;
    }
    setMessage(
      payload?.emailed
        ? "Saved and emailed the customer."
        : payload?.emailError
          ? `Saved, but the email failed: ${payload.emailError}`
          : "Saved. The customer's order page is updated.",
    );
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <select
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value)}
        className="h-10 rounded-ui border border-white/10 bg-ink px-3 text-sm text-paper"
      >
        {merchStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        value={nextNote}
        onChange={(event) => setNextNote(event.target.value)}
        className="min-h-16 rounded-ui border border-white/10 bg-ink p-2.5 text-xs leading-5 text-paper"
        placeholder="Note for the customer (optional), e.g. pickup point or rider phone"
        maxLength={500}
      />
      <label className="flex cursor-pointer items-center gap-2 text-xs text-paper/62">
        <input
          type="checkbox"
          checked={notifyCustomer}
          onChange={(event) => setNotifyCustomer(event.target.checked)}
          className="size-3.5 accent-gold"
        />
        Email the customer about this update
      </label>
      <button
        type="button"
        disabled={isSaving}
        onClick={save}
        className="focus-ring h-9 rounded-ui bg-gold px-3 text-xs font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save status"}
      </button>
      {message ? <p className="text-xs font-bold text-paper/50">{message}</p> : null}
    </div>
  );
}
