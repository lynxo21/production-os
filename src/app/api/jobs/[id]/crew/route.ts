import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  try {
    const body = await req.json();
    const slot = await prisma.jobCrew.create({
      data: {
        jobId,
        crewMemberId: body.crewMemberId || null,
        roleId: body.roleId,
        sourceType: body.sourceType || "FREELANCE",
        agreedRate: body.agreedRate != null && body.agreedRate !== "" ? parseFloat(body.agreedRate) : null,
        status: "PENDING",
      },
      include: { crewMember: true, role: true },
    });
    return NextResponse.json(slot);
  } catch (error) {
    console.error("POST /api/jobs/[id]/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { crewSlotId } = await req.json();
    await prisma.jobCrew.delete({ where: { id: crewSlotId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/jobs/[id]/crew error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
