import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { sendSubscriberBroadcast } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

const broadcastSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(10).max(5000),
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

  const subscribers = await prisma.waitlistSubscriber.findMany({
    where: { isActive: true },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ message: "No active subscribers to email." }, { status: 400 });
  }

  const broadcast = await prisma.emailBroadcast.create({
    data: {
      actorName: session.name,
      subject: parsed.data.subject,
      message: parsed.data.message,
      recipientCount: subscribers.length,
    },
  });

  let sentCount = 0;
  let failedCount = 0;
  const sentSubscriberIds: string[] = [];

  for (const subscriber of subscribers) {
    try {
      await sendSubscriberBroadcast({
        to: subscriber.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      sentCount += 1;
      sentSubscriberIds.push(subscriber.id);
    } catch (error) {
      failedCount += 1;
      console.error(`Unable to send subscriber broadcast to ${subscriber.email}`, error);
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
      recipientCount: subscribers.length,
      sentCount,
      failedCount,
    },
    request,
  });

  return NextResponse.json({
    broadcastId: broadcast.id,
    recipientCount: subscribers.length,
    sentCount,
    failedCount,
  });
}
