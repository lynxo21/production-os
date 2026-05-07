import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ORG_ID = "org-after-now-001";

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      where: { organizationId: ORG_ID },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const group = await prisma.group.create({
      data: {
        organizationId: ORG_ID,
        name: body.name,
        parentId: body.parentId || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const group = await prisma.group.update({
      where: { id: body.id },
      data: {
        name: body.name,
        parentId: body.parentId ?? undefined,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
