/* eslint-disable @typescript-eslint/no-require-imports */
const QRCode = require("qrcode");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      qrCode: true,
    },
  });

  for (const ticket of tickets) {
    const ticketUrl = `${appUrl}/tickets/${ticket.qrCode}`;
    const qrImageUrl = await QRCode.toDataURL(ticketUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrImageUrl },
    });
  }

  console.log(`Backfilled ${tickets.length} ticket QR image(s).`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

