import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function POST(req: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oldPrefix, newPrefix } = await req.json();
  if (!oldPrefix || !newPrefix) return NextResponse.json({ error: "Missing prefix" }, { status: 400 });

  // Find all units for this org with the old prefix
  const units = await prisma.itemUnit.findMany({
    where: { item: { organizationId: orgId }, barcode: { startsWith: `${oldPrefix}-` } },
    select: { id: true, barcode: true },
  });

  // Update each: replace prefix, keep numeric suffix
  await Promise.all(units.map(u =>
    prisma.itemUnit.update({
      where: { id: u.id },
      data: { barcode: `${newPrefix}-${u.barcode!.slice(oldPrefix.length + 1)}` },
    })
  ));

  return NextResponse.json({ updated: units.length });
}
