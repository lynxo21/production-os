import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  try {
    const body = await req.json();
    const unit = await prisma.itemUnit.create({
      data: {
        itemId,
        serialNumber: body.serialNumber || null,
        barcode: body.barcode || null,
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
      where: { id: body.unitId },
      data: {
        serialNumber: body.serialNumber || null,
        barcode: body.barcode || null,
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
