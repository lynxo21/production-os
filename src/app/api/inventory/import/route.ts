import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function POST(req: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = await req.json();
  let success = 0, failed = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      await prisma.item.create({
        data: {
          organizationId: orgId,
          name: item.name,
          preset: ["MODEL", "CONTAINER", "PACKAGE"].includes(item.preset) ? item.preset : "MODEL",
          shortName: item.shortName || null,
          shorthand: item.shorthand || null,
          manufacturer: item.manufacturer || null,
          standardDayRate: item.standardDayRate || null,
          replacementCost: item.replacementCost || null,
          size: item.size || null,
          narrativeDescription: item.narrativeDescription || null,
          purchaseCost: item.purchaseCost || null,
          countryOfManufacture: item.countryOfManufacture || null,
          notes: item.notes || null,
        },
      });
      success++;
    } catch (e) {
      failed++;
      errors.push(`Row "${item.name}": ${String(e)}`);
    }
  }

  return NextResponse.json({ success, failed, errors });
}
