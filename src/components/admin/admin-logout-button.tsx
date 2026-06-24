"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="focus-ring inline-flex h-10 items-center gap-2 rounded-ui border border-white/12 px-3 text-sm font-black text-paper/68 transition hover:border-lava hover:text-lava"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
