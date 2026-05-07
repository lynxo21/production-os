import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await prisma.item.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        shortName: body.shortName || null,
        shorthand: body.shorthand || null,
        size: body.size || null,
        narrativeDescription: body.narrativeDescription || null,
        purchaseCost: body.purchaseCost ? parseFloat(body.purchaseCost) : null,
        replacementCost: body.replacementCost ? parseFloat(body.replacementCost) : null,
        standardDayRate: body.standardDayRate ? parseFloat(body.standardDayRate) : null,
        manufacturer: body.manufacturer || null,
        countryOfManufacture: body.countryOfManufacture || null,
        trackRunningHours: body.trackRunningHours || false,
        hidden: body.hidden || false,
        lineMuteDefault: body.lineMuteDefault || false,
        noteMuteDefault: body.noteMuteDefault || false,
        notes: body.notes || null,
        preset: body.preset || "MODEL",
        trackedBySerial: body.trackedBySerial || false,
        isUnitContainer: body.isUnitContainer || false,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await prisma.item.update({
      where: { id: body.id },
      data: {
        name: body.name,
        shortName: body.shortName || null,
        shorthand: body.shorthand || null,
        size: body.size || null,
        narrativeDescription: body.narrativeDescription || null,
        purchaseCost: body.purchaseCost ? parseFloat(body.purchaseCost) : null,
        replacementCost: body.replacementCost ? parseFloat(body.replacementCost) : null,
        standardDayRate: body.standardDayRate ? parseFloat(body.standardDayRate) : null,
        manufacturer: body.manufacturer || null,
        countryOfManufacture: body.countryOfManufacture || null,
        trackRunningHours: body.trackRunningHours || false,
        hidden: body.hidden || false,
        lineMuteDefault: body.lineMuteDefault || false,
        noteMuteDefault: body.noteMuteDefault || false,
        notes: body.notes || null,
        preset: body.preset || "MODEL",
        trackedBySerial: body.trackedBySerial || false,
        isUnitContainer: body.isUnitContainer || false,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}