import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } },
) {
  const { prisma } = await import("@/lib/prisma");
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: { stats: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.campaignStats.upsert({
    where: { campaignId: campaign.id },
    update: {
      clickedCount: {
        increment: 1,
      },
    },
    create: {
      campaignId: campaign.id,
      clickedCount: 1,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
    },
  });

  return NextResponse.redirect(campaign.clickUrl);
}
