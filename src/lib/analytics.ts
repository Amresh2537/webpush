import { endOfDay, format, startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/prisma";

export async function getDashboardSummary(userId: string) {
  const websites = await prisma.website.findMany({
    where: { userId },
    select: { id: true },
  });

  const websiteIds = websites.map((item) => item.id);

  if (!websiteIds.length) {
    return {
      totalSubscribers: 0,
      sentToday: 0,
      ctr: 0,
      chart: [],
    };
  }

  const totalSubscribers = await prisma.subscriber.count({
    where: { websiteId: { in: websiteIds } },
  });

  const campaignsToday = await prisma.campaign.findMany({
    where: {
      websiteId: { in: websiteIds },
      sentAt: {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date()),
      },
    },
    include: {
      stats: true,
    },
  });

  const sentToday = campaignsToday.reduce(
    (sum, item) => sum + (item.stats?.sentCount || 0),
    0,
  );

  const delivered = campaignsToday.reduce(
    (sum, item) => sum + (item.stats?.deliveredCount || 0),
    0,
  );

  const clicked = campaignsToday.reduce(
    (sum, item) => sum + (item.stats?.clickedCount || 0),
    0,
  );

  const ctr = delivered ? Number(((clicked / delivered) * 100).toFixed(2)) : 0;

  const sevenDays = await Promise.all(
    Array.from({ length: 7 }).map(async (_, index) => {
      const day = subDays(new Date(), 6 - index);

      const campaigns = await prisma.campaign.findMany({
        where: {
          websiteId: { in: websiteIds },
          sentAt: {
            gte: startOfDay(day),
            lte: endOfDay(day),
          },
        },
        include: { stats: true },
      });

      const sent = campaigns.reduce(
        (sum, item) => sum + (item.stats?.sentCount || 0),
        0,
      );

      return {
        day: format(day, "EEE"),
        sent,
      };
    }),
  );

  return {
    totalSubscribers,
    sentToday,
    ctr,
    chart: sevenDays,
  };
}
