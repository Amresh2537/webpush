import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { prisma } = await import("@/lib/prisma");

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, domain: true },
    orderBy: { createdAt: "desc" },
  });

  if (websites.length === 0) {
    redirect("/onboarding?info=Please+add+a+website+before+sending+a+campaign");
  }

  return (
    <AppShell
      title="Send notification"
      description="Create a push notification to broadcast to your subscribers."
      active="campaigns"
    >
      <CampaignForm websites={websites} />
    </AppShell>
  );
}
