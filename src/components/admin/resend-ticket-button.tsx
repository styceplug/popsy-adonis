"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function ResendTicketButton({ ticketId, disabled }: { ticketId: string; disabled?: boolean }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function resendTicket() {
    setStatus("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/resend`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to resend ticket email.");
      }

      setStatus(`Sent to ${payload.email}`);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Unable to resend ticket email.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={disabled || isSending}
        onClick={resendTicket}
        className="focus-ring inline-flex h-9 items-center gap-2 rounded-ui border border-white/10 px-3 text-xs font-black text-paper/62 transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Mail size={14} />
        {isSending ? "Sending..." : "Resend ticket"}
      </button>
      {status ? <p className="mt-2 text-xs text-gold">{status}</p> : null}
      {error ? <p className="mt-2 text-xs text-lava">{error}</p> : null}
    </div>
  );
}
