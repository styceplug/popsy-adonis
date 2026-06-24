"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login() {
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const payload = await response.json().catch(() => null);

    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload?.message ?? "Unable to login.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
          placeholder="Staff name"
          suppressHydrationWarning
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-paper/72">
        Password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-ui border border-white/10 bg-ink px-4 text-paper"
          placeholder="Admin password"
          type="password"
          suppressHydrationWarning
          onKeyDown={(event) => {
            if (event.key === "Enter") login();
          }}
        />
      </label>
      {error ? <p className="rounded-ui border border-lava/40 bg-lava/10 p-3 text-sm text-lava">{error}</p> : null}
      <button
        type="button"
        disabled={!name || !password || isSubmitting}
        onClick={login}
        className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-ui bg-gold px-5 text-sm font-black text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LockKeyhole size={17} />
        {isSubmitting ? "Checking..." : "Enter admin"}
      </button>
    </div>
  );
}
