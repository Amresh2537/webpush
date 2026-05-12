import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: { websiteId: string } },
) {
  const { prisma } = await import("@/lib/prisma");
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const website = await prisma.website.findFirst({
    where: { id: params.websiteId, userId: session.user.id },
    include: {
      _count: { select: { subscribers: true } },
    },
  });

  if (!website) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    isVerified: website.isVerified,
    subscriberCount: website._count.subscribers,
    connected: website._count.subscribers > 0,
  });
}
