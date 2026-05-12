import { prisma } from "@/lib/prisma";

export async function enqueueCampaignJob(
  campaignId: string,
  websiteId: string,
  delayMs = 0,
) {
  const runAt = new Date(Date.now() + delayMs);
  await prisma.campaignJob.create({
    data: { campaignId, websiteId, runAt },
  });
}
