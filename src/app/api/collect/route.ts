import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prisma } = await import("@/lib/prisma");
  const body = await request.json();

  const website = await prisma.website.findFirst({
    where: {
      id: body.websiteId,
      domain: body.domain,
      isVerified: true,
    },
    include: {
      user: true,
    },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not verified" }, { status: 404 });
  }

  const count = await prisma.subscriber.count({
    where: { websiteId: website.id },
  });

  if (count >= website.user.subscriberLimit) {
    return NextResponse.json({ error: "Subscriber limit reached" }, { status: 403 });
  }

  const authKey = body.subscription?.keys?.auth;
  const p256dhKey = body.subscription?.keys?.p256dh;
  const endpoint = body.subscription?.endpoint;

  if (!authKey || !p256dhKey || !endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.subscriber.upsert({
    where: {
      websiteId_endpoint: {
        websiteId: website.id,
        endpoint,
      },
    },
    update: {
      authKey,
      p256dhKey,
      browser: String(body.browser || "Unknown"),
      location: body.location ? String(body.location) : null,
      pageUrl: body.pageUrl ? String(body.pageUrl) : null,
    },
    create: {
      websiteId: website.id,
      endpoint,
      authKey,
      p256dhKey,
      browser: String(body.browser || "Unknown"),
      location: body.location ? String(body.location) : null,
      pageUrl: body.pageUrl ? String(body.pageUrl) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
