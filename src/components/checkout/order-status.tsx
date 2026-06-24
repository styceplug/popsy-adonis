"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatNaira } from "@/lib/format-money";

type OrderStatusPayload = {
  reference: string;
  transactionStatus: "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";
  order: {
    status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "FULFILLED";
    subtotalKobo: number;
    transactionFeeKobo: number;
    totalKobo: number;
    tickets: Array<{
      id: string;
      qrCode: string;
      qrImageUrl?: string | null;
      event: {
        title: string;
        venue: string;
      };
    }>;
  };
};

export function OrderStatus({ reference }: { reference?: string }) {
  const [orderStatus, setOrderStatus] = useState<OrderStatusPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    async function loadOrderStatus() {
      const verifyResponse = await fetch(`/api/payments/paystack/verify/${reference}`, {
        method: "POST",
      });

      if (!verifyResponse.ok) {
        const verifyPayload = await verifyResponse.json().catch(() => null);
        throw new Error(verifyPayload?.message ?? "Unable to verify payment with Paystack.");
      }

      const response = await fetch(`/api/orders/${reference}`);
      const payload = await response.json();

      if (cancelled) return;

      if (!response.ok) {
        setError(payload.message ?? "Unable to load order status.");
        return;
      }

      setOrderStatus(payload);
    }

    loadOrderStatus().catch((statusError) => {
      if (!cancelled) {
        setError(statusError instanceof Error ? statusError.message : "Unable to load order status.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!reference) {
    return <p className="mt-6 text-paper/62">No payment reference was supplied.</p>;
  }

  if (error) {
    return <p className="mt-6 rounded-ui border border-lava/40 bg-lava/10 p-4 text-lava">{error}</p>;
  }

  if (!orderStatus) {
    return <p className="mt-6 text-paper/62">Checking payment status...</p>;
  }

  const isPaid = orderStatus.transactionStatus === "SUCCESS";
  const Icon = isPaid ? CheckCircle2 : orderStatus.transactionStatus === "FAILED" ? XCircle : Clock3;

  return (
    <div className="mt-8 max-w-2xl rounded-ui border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <Icon className={isPaid ? "text-gold" : "text-paper/50"} size={24} />
        <div>
          <p className="text-sm font-black uppercase text-gold">{orderStatus.transactionStatus}</p>
          <p className="text-sm text-paper/58">Reference: {orderStatus.reference}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 border-t border-white/10 pt-5 text-sm">
        <div className="flex justify-between text-paper/62">
          <span>Subtotal</span>
          <span>{formatNaira(orderStatus.order.subtotalKobo)}</span>
        </div>
        <div className="flex justify-between text-paper/62">
          <span>Platform charge</span>
          <span>{formatNaira(orderStatus.order.transactionFeeKobo)}</span>
        </div>
        <div className="flex justify-between text-lg font-black">
          <span>Total</span>
          <span>{formatNaira(orderStatus.order.totalKobo)}</span>
        </div>
      </div>
      {orderStatus.order.tickets.length > 0 ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-xs font-black uppercase text-gold">Issued tickets</p>
          <div className="mt-3 grid gap-3">
            {orderStatus.order.tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-ui border border-white/10 p-3 text-sm text-paper/68">
                <p className="font-bold text-paper">{ticket.event.title}</p>
                <p>{ticket.event.venue}</p>
                <p className="mt-2 font-mono text-xs">{ticket.qrCode}</p>
                <Link
                  href={`/tickets/${ticket.qrCode}`}
                  className="mt-3 inline-flex rounded-ui bg-gold px-3 py-2 text-xs font-black text-ink hover:bg-paper"
                >
                  Open ticket
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
