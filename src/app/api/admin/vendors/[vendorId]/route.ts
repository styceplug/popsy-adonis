import { NextResponse, type NextRequest } from "next/server";
import { createAdminAuditLog } from "@/lib/admin-audit";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/** Removes a vendor and its portfolio list. Files stay on Cloudinary. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: "Admin session required." }, { status: 401 });

  const { vendorId } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return NextResponse.json({ message: "Vendor not found." }, { status: 404 });

  await prisma.vendor.delete({ where: { id: vendorId } });

  await createAdminAuditLog({
    actorName: session.name,
    action: "vendor.deleted",
    entityType: "Vendor",
    entityId: vendorId,
    metadata: { name: vendor.name, category: vendor.category },
    request,
  });

  return NextResponse.json({ ok: true });
}
