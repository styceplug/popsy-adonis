import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { sendMerchStatusUpdate } from "@/lib/mailer";
import { getMerchStatusOption, getOrderStatusUrl } from "@/lib/merch-orders";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["CONFIRMED", "PROCESSING", "READY", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(500).optional().nullable(),
  // Email the buyer about the change. Only sent when the status or note actually changed.
  notifyCustomer: z.boolean().optional(),
});

/** Staff update a merch order's delivery status; the customer's order page shows it at once. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Pick a status." }, { status: 400 });

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { transaction: true } });
  if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });

  if (order.transaction?.status !== "SUCCESS") {
    return NextResponse.json({ message: "This order is not paid yet." }, { status: 409 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      merchStatus: parsed.data.status,
      merchNote: parsed.data.note || null,
      merchStatusUpdatedAt: new Date(),
    },
  });

  await createAdminAuditLog({
    actorName: session.name,
    action: "merchOrder.statusChanged",
    entityType: "Order",
    entityId: order.id,
    metadata: {
      reference: order.transaction?.reference,
      from: order.merchStatus,
      to: updated.merchStatus,
      note: updated.merchNote,
    },
    request,
  });

  const changed = order.merchStatus !== updated.merchStatus || (order.merchNote ?? null) !== (updated.merchNote ?? null);
  let emailed = false;
  let emailError: string | null = null;

  if (parsed.data.notifyCustomer && changed && order.transaction?.reference) {
    const option = getMerchStatusOption(updated.merchStatus);
    await sendMerchStatusUpdate({
      to: order.email,
      reference: order.transaction.reference,
      statusLabel: option.label,
      statusHint: option.hint,
      note: updated.merchNote,
      orderStatusUrl: getOrderStatusUrl(order.transaction.reference),
    })
      .then(() => {
        emailed = true;
      })
      .catch((error) => {
        console.error(`Unable to email merch status update for order ${order.id}`, error);
        emailError = error instanceof Error ? error.message : "Unable to send email.";
      });
  }

  return NextResponse.json({ ok: true, status: updated.merchStatus, emailed, emailError });
}
