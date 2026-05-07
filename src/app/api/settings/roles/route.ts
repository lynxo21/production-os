import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function GET() {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const roles = await prisma.role.findMany({
      where: { organizationId: orgId },
      orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const role = await prisma.role.create({
      data: {
        organizationId: orgId,
        name: body.name,
        department: body.department || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const role = await prisma.role.update({
      where: { id: body.id },
      data: {
        name: body.name,
        department: body.department || null,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
