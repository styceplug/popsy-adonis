"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, MailX } from "lucide-react";

type State = "confirm" | "unsubscribed" | "resubscribed";

export function UnsubscribeForm({
  initialEmail,
  token,
  alreadyUnsubscribed,
}: {
  initialEmail: string;
  token: string;
  alreadyUnsubscribed: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<State>(alreadyUnsubscribed ? "unsubscribed" : "confirm");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(action: "unsubscribe" | "resubscribe") {
    setError("");
    setIsSaving(true);
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: token || undefined, action }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setIsSaving(false);

    if (!response?.ok) {
      setError(payload?.message ?? "Something went wrong. Please try again.");
      return;
    }
    setState(action === "unsubscribe" ? "unsubscribed" : "resubscribed");
  }

  if (state === "unsubscribed") {
    return (
      <div className="mt-4">
        <h1 className="display-title text-5xl md:text-7xl">You&apos;re unsubscribed</h1>
        <p className="mt-5 text-lg leading-8 text-paper/65">
          <span className="font-bold text-paper">{email}</span> won&apos;t get Popsy Adonis or PA FLUX updates any more.
          Receipts and tickets for anything you buy will still reach you.
        </p>
        {token ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => submit("resubscribe")}
            className="focus-ring mt-8 inline-flex h-12 items-center rounded-ui border border-white/15 px-5 text-sm font-black text-paper transition hover:border-gold hover:text-gold disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Changed your mind? Subscribe again"}
          </button>
        ) : null}
        {error ? <p className="mt-4 text-sm font-bold text-lava">{error}</p> : null}
        <p className="mt-10 text-sm text-paper/45">
          <Link href="/" className="font-bold text-gold hover:text-paper">
            Back to popsyadonis.com
          </Link>
        </p>
      </div>
    );
  }

  if (state === "resubscribed") {
    return (
      <div className="mt-4">
        <h1 className="display-title text-5xl md:text-7xl">Welcome back</h1>
        <p className="mt-5 inline-flex items-center gap-2 text-lg text-paper/65">
          <CheckCircle2 size={20} className="text-gold" />
          {email} is back on the list.
        </p>
        <p className="mt-10 text-sm text-paper/45">
          <Link href="/" className="font-bold text-gold hover:text-paper">
            Back to popsyadonis.com
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit("unsubscribe");
      }}
    >
      <h1 className="display-title text-5xl md:text-7xl">Unsubscribe</h1>
      <p className="mt-5 text-lg leading-8 text-paper/65">
        Stop getting event news, ticket drops and PA FLUX updates from Popsy Adonis. Receipts and tickets for anything
        you buy will still be sent.
      </p>
      <label className="mt-8 grid gap-2 text-sm font-bold text-paper/72">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          readOnly={Boolean(initialEmail)}
          className="h-12 rounded-ui border border-white/10 bg-white/[0.04] px-4 text-paper read-only:text-paper/70"
          placeholder="name@email.com"
        />
      </label>
      <button
        type="submit"
        disabled={isSaving || !email}
        className="focus-ring mt-5 inline-flex h-12 items-center gap-2 rounded-ui bg-gold px-6 text-sm font-black text-ink transition hover:bg-paper disabled:opacity-50"
      >
        <MailX size={17} />
        {isSaving ? "Unsubscribing..." : "Unsubscribe"}
      </button>
      {error ? <p className="mt-4 text-sm font-bold text-lava">{error}</p> : null}
    </form>
  );
}
