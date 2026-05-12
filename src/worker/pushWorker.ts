import { CampaignStatus, JobStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildSubscriberWhere } from "@/lib/segment";
import { sendWebPush } from "@/lib/webpush";

const POLL_INTERVAL_MS = 5000;
const RATE_LIMIT_PER_SECOND = 100;
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processNextJob() {
  // Find the oldest pending job that is ready to run
  const job = await prisma.campaignJob.findFirst({
    where: {
      status: JobStatus.PENDING,
      runAt: { lte: new Date() },
    },
    orderBy: { runAt: "asc" },
  });

  if (!job) return;

  // Atomically claim the job to prevent duplicate processing
  const claimed = await prisma.campaignJob.updateMany({
    where: { id: job.id, status: JobStatus.PENDING },
    data: { status: JobStatus.PROCESSING },
  });

  if (claimed.count === 0) return;

  const { campaignId, websiteId } = job;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, websiteId },
      include: { website: true, stats: true },
    });

    if (!campaign) throw new Error("Campaign not found");

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.SENDING },
    });

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
      update: { sentCount, deliveredCount, failedCount },
      create: { campaignId: campaign.id, sentCount, deliveredCount, failedCount },
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount > 0 ? CampaignStatus.FAILED : CampaignStatus.SENT,
        sentAt: new Date(),
      },
    });

    await prisma.campaignJob.update({
      where: { id: job.id },
      data: { status: JobStatus.DONE },
    });

    console.log(`Campaign job completed: ${job.id}`);
  } catch (error) {
    console.error(`Campaign job failed: ${job.id}`, error);

    const attempts = job.attempts + 1;

    if (attempts >= MAX_ATTEMPTS) {
      await prisma.campaignJob.update({
        where: { id: job.id },
        data: { status: JobStatus.FAILED, attempts, error: String(error) },
      });
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.FAILED },
      });
    } else {
      // Exponential backoff retry
      const retryAt = new Date(Date.now() + 2000 * Math.pow(2, attempts));
      await prisma.campaignJob.update({
        where: { id: job.id },
        data: { status: JobStatus.PENDING, attempts, runAt: retryAt, error: String(error) },
      });
    }
  }
}

async function run() {
  console.log("NotifyFlow push worker started (MongoDB mode).");

  while (true) {
    try {
      await processNextJob();
    } catch (error) {
      console.error("Worker poll error", error);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

run();

