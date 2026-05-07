import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { firstName, lastName } = await req.json();

    const slugBase = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const slug = `${slugBase}-${Date.now()}`;

    const org = await prisma.organization.create({
      data: {
        name: `${firstName} ${lastName}'s Organization`,
        slug,
      },
    });

    await prisma.organizationUser.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    const member = await prisma.crewMember.create({
      data: {
        organizationId: org.id,
        firstName,
        lastName,
        type: "IN_HOUSE",
      },
    });

    return NextResponse.json({ org, member });
  } catch (error) {
    console.error("POST /api/auth/onboard error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
