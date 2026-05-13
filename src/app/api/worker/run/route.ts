import { NextResponse } from "next/server";
import { CampaignStatus, JobStatus } from "@prisma/client";

import { buildSubscriberWhere } from "@/lib/segment";
import { sendWebPush } from "@/lib/webpush";

const MAX_ATTEMPTS = 3;
// Process up to 5 jobs per cron tick to stay within Vercel function timeout
const MAX_JOBS_PER_RUN = 5;

export const maxDuration = 60; // seconds (Vercel Pro allows up to 300)

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron or an authorised caller
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");

  let processed = 0;

  for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
    // Find oldest pending job ready to run
    const job = await prisma.campaignJob.findFirst({
      where: {
        status: JobStatus.PENDING,
        runAt: { lte: new Date() },
      },
      orderBy: { runAt: "asc" },
    });

    if (!job) break;

    // Atomically claim it
    const claimed = await prisma.campaignJob.updateMany({
      where: { id: job.id, status: JobStatus.PENDING },
      data: { status: JobStatus.PROCESSING },
    });

    if (claimed.count === 0) continue;

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
          ...buildSubscriberWhere(
            (campaign.segmentFilter as Record<string, string>) || undefined,
          ),
        },
      });

      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (const subscriber of subscribers) {
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
        } catch (err) {
          console.error("Push send failed", err);
          failedCount += 1;
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
          status: deliveredCount > 0 ? CampaignStatus.SENT : CampaignStatus.FAILED,
          sentAt: new Date(),
        },
      });

      await prisma.campaignJob.update({
        where: { id: job.id },
        data: { status: JobStatus.DONE },
      });

      processed += 1;
      console.log(`Campaign job done: ${job.id}`);
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
        const retryAt = new Date(Date.now() + 2000 * Math.pow(2, attempts));
        await prisma.campaignJob.update({
          where: { id: job.id },
          data: { status: JobStatus.PENDING, attempts, runAt: retryAt, error: String(error) },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, processed });
}
