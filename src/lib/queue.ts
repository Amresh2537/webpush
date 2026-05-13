import { prisma } from "@/lib/prisma";

export async function enqueueCampaignJob(
  campaignId: string,
  websiteId: string,
) {
  const runAt = new Date();
  return prisma.campaignJob.create({
    data: { campaignId, websiteId, runAt },
  });
}
