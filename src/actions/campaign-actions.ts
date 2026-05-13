"use server";

import { CampaignStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { campaignSchema } from "@/lib/validators";
import { enqueueCampaignJob } from "@/lib/queue";
import { processJobById } from "@/lib/processJob";

export type CampaignFormState = { error: string } | null;

export async function createCampaignAction(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const { prisma } = await import("@/lib/prisma");

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
    saveAsDraft: String(formData.get("saveAsDraft") || ""),
  };

  const parsed = campaignSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const website = await prisma.website.findFirst({
    where: {
      id: parsed.data.websiteId,
      userId: session.user.id,
    },
  });

  if (!website) {
    return { error: "Website not found" };
  }

  const isDraft = parsed.data.saveAsDraft === "1";
  const status = isDraft ? CampaignStatus.DRAFT : CampaignStatus.QUEUED;

  const campaign = await prisma.campaign.create({
    data: {
      websiteId: website.id,
      title: parsed.data.title,
      message: parsed.data.message,
      iconUrl: parsed.data.iconUrl || null,
      clickUrl: parsed.data.clickUrl,
      status,
      segmentFilter: {
        browser: parsed.data.browser || undefined,
        location: parsed.data.location || undefined,
        fromDate: parsed.data.fromDate || undefined,
        toDate: parsed.data.toDate || undefined,
      },
      scheduledFor: null,
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

  if (!isDraft) {
    const job = await enqueueCampaignJob(campaign.id, website.id);
    // Fire immediately — no waiting for cron
    await processJobById(job.id);
  }

  redirect(`/dashboard?campaign=${isDraft ? "draft" : "created"}`);
}
