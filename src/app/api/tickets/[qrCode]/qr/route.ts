import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ qrCode: string }> },
) {
  const { qrCode } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode },
    select: { qrCode: true },
  });

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  }

  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tickets/${ticket.qrCode}`;
  const png = await QRCode.toBuffer(ticketUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
