"use client";

import { useState } from "react";

export function CollectWaterGunButton({
  redemptionId,
  disabled,
}: {
  redemptionId: string;
  disabled?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollected, setIsCollected] = useState(disabled ?? false);
  const [message, setMessage] = useState("");

  async function markCollected() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/admin/water-guns/${redemptionId}/collect`, {
      method: "POST",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(payload?.message ?? "Unable to mark collected.");
      setIsSubmitting(false);
      return;
    }

    setIsCollected(true);
    setMessage("Collected");
    setIsSubmitting(false);
  }

  return (
    <div className="mt-3">
      <button
        disabled={isCollected || isSubmitting}
        onClick={markCollected}
        className="focus-ring h-9 rounded-ui bg-gold px-3 text-xs font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-paper/38"
      >
        {isCollected ? "Collected" : isSubmitting ? "Saving..." : "Mark collected"}
      </button>
      {message ? <p className="mt-2 text-xs font-bold text-paper/50">{message}</p> : null}
    </div>
  );
}

