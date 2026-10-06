"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AffiliateLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/affiliate/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/affiliate/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/10 px-3 text-sm font-bold text-paper/68 hover:border-paper hover:text-paper"
    >
      <LogOut size={15} />
      Log out
    </button>
  );
}
