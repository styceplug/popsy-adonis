"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function SubscriberBroadcastForm({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function sendBroadcast() {
    setStatus("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/subscribers/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to send broadcast.");
      }

      setStatus(`Broadcast sent to ${payload.sentCount} subscriber${payload.sentCount === 1 ? "" : "s"}.`);
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
      <p className="text-xs font-black uppercase text-gold">Mail subscribers</p>
      <h3 className="mt-2 font-display text-3xl font-black">Broadcast update</h3>
      <p className="mt-2 text-sm leading-6 text-paper/55">
        Send a PA FLUX update to {subscriberCount} active subscriber{subscriberCount === 1 ? "" : "s"}.
      </p>

      <div className="mt-5 grid gap-4">
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
        disabled={!subject.trim() || !message.trim() || subscriberCount === 0 || isSubmitting}
        onClick={sendBroadcast}
        className="focus-ring mt-5 inline-flex h-11 items-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={16} />
        {isSubmitting ? "Sending..." : "Send broadcast"}
      </button>
    </div>
  );
}
