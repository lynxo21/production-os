import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ORG_ID = "org-after-now-001";

export async function GET() {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: ORG_ID },
      select: { settings: true },
    });
    return NextResponse.json(org?.settings || {});
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const org = await prisma.organization.update({
      where: { id: ORG_ID },
      data: { settings: body },
      select: { settings: true },
    });
    return NextResponse.json(org.settings);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
