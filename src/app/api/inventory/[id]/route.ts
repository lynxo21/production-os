import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        units: { orderBy: { createdAt: "asc" } },
        stock: true,
        tags: { include: { tag: true } },
      },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
