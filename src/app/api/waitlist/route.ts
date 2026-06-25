import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const waitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().trim().min(2).max(48).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter a valid email address.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source?.trim().toUpperCase().replaceAll(" ", "_") || "PA_FLUX";

  const existing = await prisma.waitlistSubscriber.findUnique({
    where: { email },
    select: { id: true },
  });

  const subscriber = await prisma.waitlistSubscriber.upsert({
    where: { email },
    update: {
      source,
      isActive: true,
    },
    create: {
      email,
      source,
    },
  });

  return NextResponse.json(
    {
      message: existing ? "You are already on the list." : "You are on the list.",
      subscriberId: subscriber.id,
      alreadySubscribed: Boolean(existing),
    },
    { status: existing ? 200 : 201 },
  );
}
