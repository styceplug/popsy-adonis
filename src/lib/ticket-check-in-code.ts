import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCheckInCode() {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
  } while (!/[A-Z]/.test(code) || !/[2-9]/.test(code));
  return code;
}

export async function withNewCheckInCode<T>(save: (code: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await save(generateCheckInCode());
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002" ||
        !Array.isArray(error.meta?.target) ||
        !error.meta.target.includes("checkInCode")
      ) {
        throw error;
      }
    }
  }
  throw new Error("Unable to assign a unique ticket check-in code.");
}

export async function ensureTicketCheckInCode(ticket: { id: string; checkInCode: string | null }) {
  if (ticket.checkInCode) return ticket.checkInCode;

  return withNewCheckInCode(async (code) => {
    // The ticket page and resend can assign a code at the same time. Keep the first one.
    const result = await prisma.ticket.updateMany({
      where: { id: ticket.id, checkInCode: null },
      data: { checkInCode: code },
    });
    if (result.count === 1) return code;

    const current = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      select: { checkInCode: true },
    });
    if (!current.checkInCode) throw new Error("Ticket check-in code could not be saved.");
    return current.checkInCode;
  });
}
