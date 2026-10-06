"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const inputClass = "h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper";

export function AffiliateAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/affiliate/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSignup ? { fullName, email, phone, password } : { email, password }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);

    if (!response?.ok) {
      setError(payload?.message ?? "Something went wrong. Try again.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/affiliate");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      {isSignup ? (
        <label className="grid gap-2 text-sm font-bold text-paper/72">
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="As it appears on your bank account" required />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@email.com" type="email" autoComplete="email" required />
      </label>
      {isSignup ? (
        <label className="grid gap-2 text-sm font-bold text-paper/72">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+234..." autoComplete="tel" required />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Password
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder={isSignup ? "At least 8 characters" : "Your password"}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </label>
      {error ? <p className="rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}
      <button
        disabled={isSubmitting}
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Please wait..." : isSignup ? "Create affiliate account" : "Log in"}
        <ArrowRight size={17} />
      </button>
      <p className="text-sm text-paper/55">
        {isSignup ? "Already an affiliate? " : "Want to sell tickets with us? "}
        <Link href={isSignup ? "/affiliate/login" : "/affiliate/signup"} className="font-black text-gold hover:text-paper">
          {isSignup ? "Log in" : "Become an affiliate"}
        </Link>
      </p>
    </form>
  );
}
