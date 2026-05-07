import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ORG_ID = "org-after-now-001";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      where: { organizationId: ORG_ID },
      orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = await prisma.role.create({
      data: {
        organizationId: ORG_ID,
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
    const { id } = await req.json();
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
