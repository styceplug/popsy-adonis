"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Audience = "subscribers" | "buyers" | "both";

export function SubscriberBroadcastForm({
  subscriberCount,
  buyerCount,
}: {
  subscriberCount: number;
  buyerCount: number;
}) {
  const [audience, setAudience] = useState<Audience>("subscribers");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audiences: Array<{ value: Audience; label: string; description: string; count: number }> = [
    {
      value: "subscribers",
      label: `Subscribers (${subscriberCount})`,
      description: "People who joined the subscription list",
      count: subscriberCount,
    },
    {
      value: "buyers",
      label: `Ticket buyers (${buyerCount})`,
      description: "Everyone who has paid for a ticket",
      count: buyerCount,
    },
    {
      value: "both",
      label: "Both lists",
      description: "Combined, each person emailed once",
      count: subscriberCount + buyerCount,
    },
  ];
  const selectedAudience = audiences.find((item) => item.value === audience);

  async function sendBroadcast() {
    setStatus("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/subscribers/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, audience }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to send broadcast.");
      }

      setStatus(`Sent to ${payload.sentCount} of ${payload.recipientCount} recipient${payload.recipientCount === 1 ? "" : "s"}.`);
      setSubject("");
      setMessage("");
    } catch (broadcastError) {
      setError(broadcastError instanceof Error ? broadcastError.message : "Unable to send broadcast.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-ui border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs font-black uppercase text-gold">Send an email</p>
      <h3 className="mt-2 font-display text-3xl font-black">Broadcast</h3>

      <div className="mt-5 grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold text-paper/72">Who should get it?</legend>
          <div className="mt-2 grid gap-2">
            {audiences.map((item) => (
              <label
                key={item.value}
                className={`flex cursor-pointer items-start gap-3 rounded-ui border p-3 transition ${
                  audience === item.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value={item.value}
                  checked={audience === item.value}
                  onChange={() => setAudience(item.value)}
                  className="mt-1 size-4 accent-gold"
                />
                <span>
                  <span className="block text-sm font-black text-paper">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-paper/48">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm font-bold text-paper/72">
          Subject
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-11 rounded-ui border border-white/10 bg-ink px-3 text-paper"
            placeholder="PA FLUX drop update"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-paper/72">
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-40 rounded-ui border border-white/10 bg-ink p-3 text-paper"
            placeholder="Write the email body..."
          />
        </label>
      </div>

      {status ? <p className="mt-4 rounded-ui border border-gold/35 bg-gold/10 p-3 text-sm text-gold">{status}</p> : null}
      {error ? <p className="mt-4 rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}

      <button
        type="button"
        disabled={!subject.trim() || !message.trim() || (selectedAudience?.count ?? 0) === 0 || isSubmitting}
        onClick={sendBroadcast}
        className="focus-ring mt-5 inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} />
        {isSubmitting ? "Sending..." : "Send broadcast"}
      </button>
    </div>
  );
}
