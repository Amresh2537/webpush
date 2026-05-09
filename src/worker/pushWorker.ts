import { Worker } from "bullmq";
import { CampaignStatus } from "@prisma/client";

import { CAMPAIGN_QUEUE_NAME } from "@/lib/queue";
import { getRedisConnection } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { buildSubscriberWhere } from "@/lib/segment";
import { sendWebPush } from "@/lib/webpush";

const RATE_LIMIT_PER_SECOND = 100;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const worker = new Worker(
  CAMPAIGN_QUEUE_NAME,
  async (job) => {
    const { campaignId, websiteId } = job.data as {
      campaignId: string;
      websiteId: string;
    };

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, websiteId },
      include: {
        website: true,
        stats: true,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.SENDING },
    });

    if (!campaign.stats) {
      await prisma.campaignStats.create({
        data: {
          campaignId: campaign.id,
        },
      });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: {
        websiteId: campaign.websiteId,
        ...buildSubscriberWhere((campaign.segmentFilter as Record<string, string>) || undefined),
      },
    });

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subscribers.length; i += 1) {
      const subscriber = subscribers[i];

      try {
        await sendWebPush(
          campaign.website.vapidPublicKey,
          campaign.website.vapidPrivateKey,
          {
            endpoint: subscriber.endpoint,
            keys: {
              auth: subscriber.authKey,
              p256dh: subscriber.p256dhKey,
            },
          },
          {
            title: campaign.title,
            message: campaign.message,
            iconUrl: campaign.iconUrl,
            clickUrl: campaign.clickUrl,
            campaignId: campaign.id,
          },
        );

        sentCount += 1;
        deliveredCount += 1;
      } catch (error) {
        console.error("Push send failed", error);
        failedCount += 1;
      }

      if ((i + 1) % RATE_LIMIT_PER_SECOND === 0) {
        await sleep(1000);
      }
    }

    await prisma.campaignStats.upsert({
      where: { campaignId: campaign.id },
      update: {
        sentCount,
        deliveredCount,
        failedCount,
      },
      create: {
        campaignId: campaign.id,
        sentCount,
        deliveredCount,
        failedCount,
      },
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount > 0 ? CampaignStatus.FAILED : CampaignStatus.SENT,
        sentAt: new Date(),
      },
    });
  },
  {
    connection: getRedisConnection(),
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  console.log(`Campaign job completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Campaign job failed: ${job?.id}`, error);
});

console.log("NotifyFlow worker started.");
