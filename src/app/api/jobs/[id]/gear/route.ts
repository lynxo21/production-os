import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  try {
    const body = await req.json();
    const lineItem = await prisma.jobLineItem.create({
      data: {
        jobId,
        itemId: body.itemId || null,
        displayName: body.displayName,
        quantityRequested: parseInt(body.quantityRequested) || 1,
        dayRate: body.dayRate != null ? parseFloat(body.dayRate) : null,
        days: parseInt(body.days) || 1,
      },
      include: { item: true },
    });
    return NextResponse.json(lineItem);
  } catch (error) {
    console.error("POST /api/jobs/[id]/gear error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { lineItemId } = await req.json();
    await prisma.jobLineItem.delete({ where: { id: parseInt(lineItemId) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/jobs/[id]/gear error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
