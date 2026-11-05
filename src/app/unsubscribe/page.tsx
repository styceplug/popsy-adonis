import { UnsubscribeForm } from "@/components/email/unsubscribe-form";
import { isUnsubscribed, isValidUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email preferences | Popsy Adonis",
  robots: { index: false, follow: false },
};

/**
 * Link target for the unsubscribe line in marketing emails:
 *   our own broadcasts:  /unsubscribe?email=...&token=...  (added automatically)
 *   Resend templates:    https://popsyadonis.com/unsubscribe?email={{{contact.email}}}
 * Nothing changes until the person presses the button, so link scanners can't unsubscribe anyone.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; token?: string | string[] }>;
}) {
  const params = await searchParams;
  const email = (Array.isArray(params.email) ? params.email[0] : params.email)?.trim().toLowerCase() ?? "";
  const token = (Array.isArray(params.token) ? params.token[0] : params.token) ?? "";
  const verified = email ? isValidUnsubscribeToken(email, token) : false;
  const alreadyOut = email ? await isUnsubscribed(email).catch(() => false) : false;

  return (
    <main className="min-h-screen bg-ink pt-28 text-paper">
      <section className="section-shell max-w-2xl pb-20">
        <p className="text-xs font-black uppercase text-gold">Email preferences</p>
        <UnsubscribeForm initialEmail={email} token={verified ? token : ""} alreadyUnsubscribed={alreadyOut} />
      </section>
    </main>
  );
}
