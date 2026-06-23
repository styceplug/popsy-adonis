"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submitContactForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to send inquiry.");
      }

      setStatus("sent");
      setFeedback(payload.message ?? "Inquiry sent.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Unable to send inquiry.");
    }
  }

  return (
    <form onSubmit={submitContactForm} className="grid gap-4 rounded-ui border border-white/10 bg-white/[0.035] p-5">
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Phone
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Message
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-36 rounded-ui border border-white/10 bg-ink p-4 text-paper"
          required
        />
      </label>
      {feedback ? (
        <p className={`rounded-ui border p-3 text-sm ${status === "error" ? "border-lava/40 bg-lava/10 text-lava" : "border-gold/40 bg-gold/10 text-gold"}`}>
          {feedback}
        </p>
      ) : null}
      <button
        disabled={status === "sending"}
        className="focus-ring h-12 rounded-ui bg-gold px-5 text-sm font-black text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}

