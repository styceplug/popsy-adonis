import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { sendSubscriberBroadcast } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { getTicketBuyerEmails } from "@/lib/ticket-buyers";

const broadcastSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(10).max(5000),
  audience: z.enum(["subscribers", "buyers", "both"]).default("subscribers"),
});

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = broadcastSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid subject and message.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { audience } = parsed.data;
  const subscribers =
    audience === "buyers"
      ? []
      : await prisma.waitlistSubscriber.findMany({
          where: { isActive: true },
          select: { id: true, email: true },
          orderBy: { createdAt: "asc" },
        });
  const buyerEmails = audience === "subscribers" ? [] : await getTicketBuyerEmails();

  const recipients = new Map<string, { email: string; subscriberId?: string }>();
  for (const subscriber of subscribers) {
    recipients.set(subscriber.email.trim().toLowerCase(), { email: subscriber.email, subscriberId: subscriber.id });
  }
  for (const email of buyerEmails) {
    if (!recipients.has(email)) recipients.set(email, { email });
  }

  if (recipients.size === 0) {
    return NextResponse.json({ message: "No one to email for this audience yet." }, { status: 400 });
  }

  const broadcast = await prisma.emailBroadcast.create({
    data: {
      actorName: session.name,
      subject: parsed.data.subject,
      message: parsed.data.message,
      recipientCount: recipients.size,
    },
  });

  let sentCount = 0;
  let failedCount = 0;
  const sentSubscriberIds: string[] = [];

  for (const recipient of recipients.values()) {
    try {
      await sendSubscriberBroadcast({
        to: recipient.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      sentCount += 1;
      if (recipient.subscriberId) sentSubscriberIds.push(recipient.subscriberId);
    } catch (error) {
      failedCount += 1;
      console.error(`Unable to send subscriber broadcast to ${recipient.email}`, error);
    }
  }

  await prisma.$transaction([
    prisma.emailBroadcast.update({
      where: { id: broadcast.id },
      data: { sentCount, failedCount },
    }),
    prisma.waitlistSubscriber.updateMany({
      where: { id: { in: sentSubscriberIds } },
      data: { lastBroadcastAt: new Date() },
    }),
  ]);

  await createAdminAuditLog({
    actorName: session.name,
    action: "subscribers.broadcast.sent",
    entityType: "EmailBroadcast",
    entityId: broadcast.id,
    metadata: {
      subject: parsed.data.subject,
      audience,
      recipientCount: recipients.size,
      sentCount,
      failedCount,
    },
    request,
  });

  return NextResponse.json({
    broadcastId: broadcast.id,
    audience,
    recipientCount: recipients.size,
    sentCount,
    failedCount,
  });
}
