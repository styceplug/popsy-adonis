import { redirect } from "next/navigation";
import { AffiliateAuthForm } from "@/components/affiliate/affiliate-auth-form";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export default async function AffiliateSignupPage() {
  if (await getCurrentAffiliate()) redirect("/affiliate");

  return (
    <section className="section-shell flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-md rounded-ui border border-white/10 bg-white/[0.035] p-6">
        <p className="text-xs font-black uppercase text-gold">Popsy Adonis Affiliates</p>
        <h1 className="mt-3 font-display text-4xl font-black">Become an affiliate</h1>
        <p className="mt-3 text-sm leading-6 text-paper/60">Share Popsy Adonis ticket links and earn a commission on every ticket bought through them. New accounts are reviewed before links go live.</p>
        <AffiliateAuthForm mode="signup" />
      </div>
    </section>
  );
}
