import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: { client: true, tier: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orgId = body.organizationId;

    let jobNumber = body.jobNumber || null;

    // Auto-generate job number if setting is enabled and no number was provided
    if (!jobNumber) {
      const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
      const settings = (org?.settings as any) || {};
      if (settings.autoJobNumber) {
        const prefix = settings.jobNumberPrefix || "JOB";
        const existing = await prisma.job.findMany({
          where: { organizationId: orgId, jobNumber: { startsWith: `${prefix}-` } },
          select: { jobNumber: true },
        });
        const nums = existing
          .map(j => parseInt(j.jobNumber!.slice(prefix.length + 1)))
          .filter(n => !isNaN(n) && n > 0);
        const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
        jobNumber = `${prefix}-${String(next).padStart(3, "0")}`;
      }
    }

    const job = await prisma.job.create({
      data: {
        organizationId: orgId,
        clientId: body.clientId || null,
        name: body.name,
        jobNumber,
        status: body.status || "DRAFT",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        shootDays: body.shootDays ? parseInt(body.shootDays) : null,
        location: body.location || null,
        notes: body.notes || null,
        internalNotes: body.internalNotes || null,
      },
      include: { client: true, tier: true },
    });
    return NextResponse.json(job);
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const job = await prisma.job.update({
      where: { id: body.id },
      data: {
        clientId: body.clientId || null,
        name: body.name,
        jobNumber: body.jobNumber || null,
        status: body.status || "DRAFT",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        shootDays: body.shootDays ? parseInt(body.shootDays) : null,
        location: body.location || null,
        notes: body.notes || null,
        internalNotes: body.internalNotes || null,
      },
      include: { client: true, tier: true },
    });
    return NextResponse.json(job);
  } catch (error) {
    console.error("PUT /api/jobs error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/jobs error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
