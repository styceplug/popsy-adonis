import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMessage } from "@/lib/mailer";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid contact payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await sendContactMessage(parsed.data);

    return NextResponse.json({
      message: result.skipped
        ? "Message accepted locally. Configure RESEND_API_KEY to send email."
        : "Message sent.",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send message." },
      { status: 502 },
    );
  }
}

