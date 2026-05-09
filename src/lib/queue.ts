import { Queue } from "bullmq";

import { getRedisConnection } from "@/lib/redis";

export const CAMPAIGN_QUEUE_NAME = "notifyflow-campaigns";

let campaignQueue: Queue | null = null;

function getCampaignQueue() {
  if (campaignQueue) {
    return campaignQueue;
  }

  campaignQueue = new Queue(CAMPAIGN_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });

  return campaignQueue;
}

export async function enqueueCampaignJob(
  campaignId: string,
  websiteId: string,
  delayMs = 0,
) {
  await getCampaignQueue().add(
    "send-campaign",
    { campaignId, websiteId },
    {
      delay: delayMs,
      attempts: 3,
    },
  );
}
