"use server";

import { CampaignStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campaignSchema } from "@/lib/validators";
import { enqueueCampaignJob } from "@/lib/queue";

export async function createCampaignAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const payload = {
    websiteId: String(formData.get("websiteId") || ""),
    title: String(formData.get("title") || ""),
    message: String(formData.get("message") || ""),
    iconUrl: String(formData.get("iconUrl") || ""),
    clickUrl: String(formData.get("clickUrl") || ""),
    browser: String(formData.get("browser") || ""),
    location: String(formData.get("location") || ""),
    fromDate: String(formData.get("fromDate") || ""),
    toDate: String(formData.get("toDate") || ""),
    scheduleAt: String(formData.get("scheduleAt") || ""),
  };

  const parsed = campaignSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/campaigns/new?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid campaign data")}`);
  }

  const website = await prisma.website.findFirst({
    where: {
      id: parsed.data.websiteId,
      userId: session.user.id,
      isVerified: true,
    },
  });

  if (!website) {
    redirect("/campaigns/new?error=Website%20not%20found%20or%20not%20verified");
  }

  const scheduleAt = parsed.data.scheduleAt ? new Date(parsed.data.scheduleAt) : null;

  const campaign = await prisma.campaign.create({
    data: {
      websiteId: website.id,
      title: parsed.data.title,
      message: parsed.data.message,
      iconUrl: parsed.data.iconUrl || null,
      clickUrl: parsed.data.clickUrl,
      status: scheduleAt ? CampaignStatus.SCHEDULED : CampaignStatus.QUEUED,
      segmentFilter: {
        browser: parsed.data.browser || undefined,
        location: parsed.data.location || undefined,
        fromDate: parsed.data.fromDate || undefined,
        toDate: parsed.data.toDate || undefined,
      },
      scheduledFor: scheduleAt,
      stats: {
        create: {
          sentCount: 0,
          deliveredCount: 0,
          clickedCount: 0,
          failedCount: 0,
        },
      },
    },
  });

  const delayMs = scheduleAt ? Math.max(scheduleAt.getTime() - Date.now(), 0) : 0;

  await enqueueCampaignJob(campaign.id, website.id, delayMs);

  redirect("/dashboard?campaign=created");
}
