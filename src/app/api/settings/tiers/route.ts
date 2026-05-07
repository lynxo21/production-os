import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ORG_ID = "org-after-now-001";

export async function GET() {
  try {
    const tiers = await prisma.budgetTier.findMany({
      where: { organizationId: ORG_ID },
      orderBy: { tierNumber: "asc" },
    });
    return NextResponse.json(tiers);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = await prisma.budgetTier.create({
      data: {
        organizationId: ORG_ID,
        tierNumber: body.tierNumber,
        name: body.name,
        description: body.description || null,
        budgetMin: body.budgetMin ? parseFloat(body.budgetMin) : null,
        budgetMax: body.budgetMax ? parseFloat(body.budgetMax) : null,
        color: body.color || "#888888",
      },
    });
    return NextResponse.json(tier);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = await prisma.budgetTier.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || null,
        budgetMin: body.budgetMin ? parseFloat(body.budgetMin) : null,
        budgetMax: body.budgetMax ? parseFloat(body.budgetMax) : null,
        color: body.color || "#888888",
      },
    });
    return NextResponse.json(tier);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.budgetTier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
