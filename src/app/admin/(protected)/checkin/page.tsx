import { AdminCheckInPanel } from "@/components/admin/admin-check-in-panel";

export const metadata = {
  title: "Check In | Popsy Adonis Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCheckInPage() {
  return (
    <div>
      <p className="text-xs font-black uppercase text-gold">Gate check-in</p>
      <h2 className="mt-2 font-display text-5xl font-black">Scan tickets</h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/58">
        Scan a ticket QR code or paste the ticket URL/code manually. Successful scans immediately mark the ticket as checked in.
      </p>
      <AdminCheckInPanel />
    </div>
  );
}
