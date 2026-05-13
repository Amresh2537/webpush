import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const { prisma } = await import("@/lib/prisma");
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get last 5 jobs for this user's websites
  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const jobs = await prisma.campaignJob.findMany({
    where: { websiteId: { in: websites.map((w) => w.id) } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json(jobs);
}
