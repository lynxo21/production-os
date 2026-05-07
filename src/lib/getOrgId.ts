import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    select: { organizationId: true },
  });

  // Auto-provision an org for legacy accounts that pre-date multi-tenancy
  if (!orgUser) {
    const email = user.email ?? "user";
    const slug = `${email.split("@")[0]}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const org = await prisma.organization.create({
      data: { name: `${email}'s Organization`, slug },
    });
    orgUser = await prisma.organizationUser.create({
      data: { organizationId: org.id, userId: user.id, role: "OWNER" },
      select: { organizationId: true },
    });
  }

  return orgUser.organizationId;
}
