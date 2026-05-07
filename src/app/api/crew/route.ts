import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function GET() {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const crew = await prisma.crewMember.findMany({
      where: { organizationId: orgId },
      include: {
        roles: {
          include: { role: true },
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: { lastName: "asc" },
    });
    return NextResponse.json(crew);
  } catch (error) {
    console.error("GET /api/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    console.log("Crew POST body:", JSON.stringify(body, null, 2));

    const member = await prisma.crewMember.create({
      data: {
        organizationId: orgId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type || "FREELANCE",
        location: body.location || null,
        workedWithBefore: body.workedWithBefore || false,
        hiredBefore: body.hiredBefore || false,
        standardDayRate: body.standardDayRate ? parseFloat(body.standardDayRate) : null,
        overtimeRate: body.overtimeRate ? parseFloat(body.overtimeRate) : null,
        unionStatus: body.unionStatus || null,
        notes: body.notes || null,
        tierFloor: body.minimumTier || null,
      },
    });

    if (body.roles && body.roles.length > 0) {
      for (const [index, r] of body.roles.entries()) {
        let role = await prisma.role.findFirst({
          where: { name: r.role, organizationId: orgId },
        });
        if (!role) {
          role = await prisma.role.create({
            data: { name: r.role, organizationId: orgId, sortOrder: index },
          });
        }
        await prisma.crewMemberRole.create({
          data: {
            crewMemberId: member.id,
            roleId: role.id,
            isPrimary: r.isPrimary,
            sortOrder: index,
          },
        });
      }
    }

    const memberWithRoles = await prisma.crewMember.findUnique({
      where: { id: member.id },
      include: {
        roles: { include: { role: true }, orderBy: { isPrimary: "desc" } },
      },
    });

    return NextResponse.json(memberWithRoles);
  } catch (error) {
    console.error("POST /api/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const member = await prisma.crewMember.update({
      where: { id: body.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type || "FREELANCE",
        location: body.location || null,
        workedWithBefore: body.workedWithBefore || false,
        hiredBefore: body.hiredBefore || false,
        tierFloor: body.minimumTier || null,
        unionStatus: body.unionStatus || null,
        notes: body.notes || null,
      },
    });

    await prisma.crewMemberRole.deleteMany({
      where: { crewMemberId: body.id },
    });

    if (body.roles && body.roles.length > 0) {
      for (const [index, r] of body.roles.entries()) {
        let role = await prisma.role.findFirst({
          where: { name: r.role, organizationId: orgId },
        });
        if (!role) {
          role = await prisma.role.create({
            data: { name: r.role, organizationId: orgId, sortOrder: index },
          });
        }
        await prisma.crewMemberRole.create({
          data: {
            crewMemberId: member.id,
            roleId: role.id,
            isPrimary: r.isPrimary,
            sortOrder: index,
          },
        });
      }
    }

    const updated = await prisma.crewMember.findUnique({
      where: { id: member.id },
      include: {
        roles: { include: { role: true }, orderBy: { isPrimary: "desc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = await getOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.crewMemberRole.deleteMany({ where: { crewMemberId: id } });
    await prisma.crewMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
