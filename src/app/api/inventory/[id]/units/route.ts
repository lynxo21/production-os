import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  try {
    const body = await req.json();

    let barcodeValue: string | null = body.unitId || null;

    if (!barcodeValue) {
      // Auto-generate Unit ID
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { organizationId: true },
      });
      if (item) {
        const org = await prisma.organization.findUnique({
          where: { id: item.organizationId },
          select: { settings: true },
        });
        const prefix = (org?.settings as any)?.unitIdPrefix || "UNIT";
        const existingUnits = await prisma.itemUnit.findMany({
          where: {
            item: { organizationId: item.organizationId },
            barcode: { startsWith: `${prefix}-` },
          },
          select: { barcode: true },
        });
        const nums = existingUnits
          .map(u => parseInt(u.barcode!.slice(prefix.length + 1)))
          .filter(n => !isNaN(n) && n > 0);
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        barcodeValue = `${prefix}-${String(next).padStart(5, "0")}`;
      }
    }

    const unit = await prisma.itemUnit.create({
      data: {
        itemId,
        serialNumber: body.serialNumber || null,
        barcode: barcodeValue,
        condition: body.condition || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice != null && body.purchasePrice !== "" ? parseFloat(body.purchasePrice) : null,
        vendor: body.vendor || null,
        runningHours: body.runningHours != null ? parseFloat(body.runningHours) : 0,
        status: body.status || "AVAILABLE",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(unit);
  } catch (error) {
    console.error("POST /api/inventory/[id]/units error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const body = await req.json();
    const unit = await prisma.itemUnit.update({
      where: { id: body.id },
      data: {
        serialNumber: body.serialNumber || null,
        barcode: body.unitId || null,
        condition: body.condition || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice != null && body.purchasePrice !== "" ? parseFloat(body.purchasePrice) : null,
        vendor: body.vendor || null,
        runningHours: body.runningHours != null ? parseFloat(body.runningHours) : 0,
        status: body.status != null ? body.status : "AVAILABLE",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(unit);
  } catch (error) {
    console.error("PUT /api/inventory/[id]/units error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { unitId } = await req.json();
    await prisma.itemUnit.delete({ where: { id: unitId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory/[id]/units error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
