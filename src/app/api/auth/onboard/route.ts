import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ORG_ID = "org-after-now-001";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName } = await req.json();
    const member = await prisma.crewMember.create({
      data: {
        organizationId: ORG_ID,
        firstName,
        lastName,
        type: "IN_HOUSE",
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    console.error("POST /api/auth/onboard error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
