import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { sendSubscriberBroadcast } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
// A full list is too large for one request. Each call stays well under this.
export const maxDuration = 60;

const CHUNK_BUDGET_MS = 20_000;
const MAX_CHUNK = 25;

const createSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(10).max(5000),
  audience: z.enum(["subscribers", "buyers", "both"]),
});

const continueSchema = z.object({
  broadcastId: z.string().min(1),
  audience: z.enum(["subscribers", "buyers", "both"]),
});

type Audience = "subscribers" | "buyers" | "both";

type Recipient = {
  email: string;
  subscriberId?: string;
};

async function loadRecipients(audience: Audience): Promise<Recipient[]> {
  const subscribers =
    audience === "buyers"
      ? []
      : await prisma.waitlistSubscriber.findMany({
          where: { isActive: true },
          select: { id: true, email: true },
        });
  const buyerEmails =
    audience === "subscribers"
      ? []
      : (
          await prisma.order.findMany({
            where: {
              OR: [{ status: "PAID" }, { transaction: { status: "SUCCESS" } }],
              items: { some: { itemType: "ticket" } },
            },
            select: { email: true },
            distinct: ["email"],
          })
        ).map((order) => order.email);

  const recipients = new Map<string, Recipient>();
  for (const subscriber of subscribers) {
    const email = subscriber.email.trim().toLowerCase();
    if (!email) continue;
    recipients.set(email, { email: subscriber.email.trim(), subscriberId: subscriber.id });
  }
  for (const rawEmail of buyerEmails) {
    const email = rawEmail.trim().toLowerCase();
    if (!email || recipients.has(email)) continue;
    recipients.set(email, { email });
  }

  return [...recipients.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function POST(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const broadcastId = typeof body?.broadcastId === "string" ? body.broadcastId : "";

  if (!broadcastId) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Enter a valid subject and message.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const recipients = await loadRecipients(parsed.data.audience);
    if (recipients.length === 0) {
      return NextResponse.json({ message: "No one to email for this audience yet." }, { status: 400 });
    }

    const broadcast = await prisma.emailBroadcast.create({
      data: {
        actorName: session.name,
        subject: parsed.data.subject,
        message: parsed.data.message,
        recipientCount: recipients.length,
      },
    });

    return NextResponse.json({
      broadcastId: broadcast.id,
      audience: parsed.data.audience,
      recipientCount: recipients.length,
      sentCount: 0,
      failedCount: 0,
      done: false,
    });
  }

  const parsed = continueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose who should get this email." }, { status: 400 });
  }

  const broadcast = await prisma.emailBroadcast.findUnique({ where: { id: parsed.data.broadcastId } });
  if (!broadcast) {
    return NextResponse.json({ message: "That broadcast could not be found." }, { status: 404 });
  }

  const recipients = await loadRecipients(parsed.data.audience);
  const offset = broadcast.sentCount + broadcast.failedCount;
  const pending = recipients.slice(offset);
  const started = Date.now();
  let sent = 0;
  let failed = 0;
  const sentSubscriberIds: string[] = [];

  for (const recipient of pending) {
    if (sent + failed >= MAX_CHUNK) break;
    if (sent + failed > 0 && Date.now() - started >= CHUNK_BUDGET_MS) break;

    let delivered = false;
    try {
      await sendSubscriberBroadcast({
        to: recipient.email,
        subject: broadcast.subject,
        message: broadcast.message,
      });
      delivered = true;
      sent += 1;
      if (recipient.subscriberId) sentSubscriberIds.push(recipient.subscriberId);
    } catch (error) {
      failed += 1;
      console.error(`Unable to send subscriber broadcast to ${recipient.email}`, error);
    }

    await prisma.emailBroadcast.update({
      where: { id: broadcast.id },
      data: {
        sentCount: { increment: delivered ? 1 : 0 },
        failedCount: { increment: delivered ? 0 : 1 },
      },
    });
  }

  if (sentSubscriberIds.length > 0) {
    await prisma.waitlistSubscriber.updateMany({
      where: { id: { in: sentSubscriberIds } },
      data: { lastBroadcastAt: new Date() },
    });
  }

  const sentCount = broadcast.sentCount + sent;
  const failedCount = broadcast.failedCount + failed;
  const done = sentCount + failedCount >= recipients.length;

  if (done) {
    await createAdminAuditLog({
      actorName: session.name,
      action: "subscribers.broadcast.sent",
      entityType: "EmailBroadcast",
      entityId: broadcast.id,
      metadata: {
        subject: broadcast.subject,
        audience: parsed.data.audience,
        recipientCount: recipients.length,
        sentCount,
        failedCount,
      },
      request,
    });
  }

  return NextResponse.json({
    broadcastId: broadcast.id,
    audience: parsed.data.audience,
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    done,
  });
}
