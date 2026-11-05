// Read-only: lists the name each ticket buyer gave, for adding first names to a mailing list.
//
//   node --env-file=.env scripts/export-contact-names.mjs
//
// Writes node_modules/.cache/contact-names.csv (kept out of git) with columns email,name.
// Uses the most recent non-empty ticket name for each buyer email.
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const OUTPUT = "node_modules/.cache/contact-names.csv";
const prisma = new PrismaClient();

const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const tidy = (name) => name.replace(/\s+/g, " ").trim();

try {
  const tickets = await prisma.ticket.findMany({
    where: {
      attendeeName: { not: null },
      order: { OR: [{ status: "PAID" }, { status: "FULFILLED" }, { transaction: { status: "SUCCESS" } }] },
    },
    select: { attendeeName: true, attendeeEmail: true, createdAt: true, order: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const names = new Map();
  for (const ticket of tickets) {
    const name = tidy(ticket.attendeeName ?? "");
    if (!name) continue;
    // A ticket names its holder; the buyer is the order email, or the ticket's own email when set.
    for (const email of [ticket.attendeeEmail, ticket.order.email]) {
      const key = email?.trim().toLowerCase();
      if (key && !names.has(key)) names.set(key, name);
    }
  }

  await mkdir("node_modules/.cache", { recursive: true });
  await writeFile(
    OUTPUT,
    ["email,name", ...[...names].map(([email, name]) => `${cell(email)},${cell(name)}`)].join("\n"),
  );
  console.log(`Saved ${names.size} names to ${OUTPUT}`);
} finally {
  await prisma.$disconnect();
}
