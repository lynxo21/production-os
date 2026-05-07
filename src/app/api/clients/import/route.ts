import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgId } from "@/lib/getOrgId";

export async function POST(req: NextRequest) {
  const orgId = await getOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clients } = await req.json();
  let success = 0, failed = 0;
  const errors: string[] = [];

  for (const c of clients) {
    try {
      await prisma.client.create({
        data: {
          organizationId: orgId,
          name: c.name,
          contactName: c.contactName || null,
          company: c.company || null,
          email: c.email || null,
          phone: c.phone || null,
          billingAddress: c.billingAddress || null,
          notes: c.notes || null,
        },
      });
      success++;
    } catch (e) {
      failed++;
      errors.push(`Row "${c.name}": ${String(e)}`);
    }
  }

  return NextResponse.json({ success, failed, errors });
}
