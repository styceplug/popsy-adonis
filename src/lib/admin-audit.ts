import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AdminAuditInput = {
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
  request?: NextRequest;
};

export async function createAdminAuditLog(input: AdminAuditInput) {
  const forwardedFor = input.request?.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? input.request?.headers.get("x-real-ip") ?? undefined;
  const userAgent = input.request?.headers.get("user-agent") ?? undefined;

  try {
    return await prisma.adminAuditLog.create({
      data: {
        actorName: input.actorName,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Unable to create admin audit log", error);
    return null;
  }
}
