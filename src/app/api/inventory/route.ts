import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function GET() {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const items = await prisma.item.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { units: true } },
        stock: { select: { quantityOwned: true } },
      },
    });
    const result = items.map(item => ({
      ...item,
      qty: item.trackedBySerial ? item._count.units : (item.stock?.quantityOwned ?? 0),
    }));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const item = await prisma.item.create({
      data: {
        organizationId: orgId,
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
        primaryGroupId: body.primaryGroupId || null,
      },
    });
    if (!body.trackedBySerial) {
      await prisma.itemStock.create({
        data: { itemId: item.id, quantityOwned: parseInt(body.quantityOwned) || 0, quantityAvailable: parseInt(body.quantityOwned) || 0 },
      });
    }
    return NextResponse.json({ ...item, qty: body.trackedBySerial ? 0 : (parseInt(body.quantityOwned) || 0) });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        primaryGroupId: body.primaryGroupId || null,
      },
    });
    let qty = 0;
    if (!body.trackedBySerial) {
      const qtyOwned = parseInt(body.quantityOwned) || 0;
      await prisma.itemStock.upsert({
        where: { itemId: body.id },
        update: { quantityOwned: qtyOwned, quantityAvailable: qtyOwned },
        create: { itemId: body.id, quantityOwned: qtyOwned, quantityAvailable: qtyOwned },
      });
      qty = qtyOwned;
    } else {
      const unitCount = await prisma.itemUnit.count({ where: { itemId: body.id } });
      qty = unitCount;
    }
    return NextResponse.json({ ...item, qty });
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
