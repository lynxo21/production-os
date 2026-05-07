import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        tier: true,
        lineItems: {
          include: { item: true },
          orderBy: { sortOrder: "asc" },
        },
        crew: {
          include: { crewMember: true, role: true },
        },
      },
    });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
