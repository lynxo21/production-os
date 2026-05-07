import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function GET() {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const groups = await prisma.group.findMany({
      where: { organizationId: orgId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        primaryItems: {
          where: { active: true },
          select: {
            trackedBySerial: true,
            _count: { select: { units: true } },
            stock: { select: { quantityOwned: true } },
          },
        },
      },
    });

    const result = groups.map(g => ({
      id: g.id,
      name: g.name,
      parentId: g.parentId,
      sortOrder: g.sortOrder,
      itemCount: g.primaryItems.reduce((sum, item) => {
        if (item.trackedBySerial) return sum + item._count.units;
        return sum + (item.stock?.quantityOwned ?? 0);
      }, 0),
    }));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const group = await prisma.group.create({
      data: {
        organizationId: orgId,
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
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
