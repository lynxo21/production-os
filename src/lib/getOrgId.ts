import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    select: { organizationId: true },
  });
  return orgUser?.organizationId ?? null;
}
