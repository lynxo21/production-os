import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        defaultTier: true,
        jobs: {
          include: { tier: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("GET /api/clients/[id] error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
