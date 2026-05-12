import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const { prisma } = await import("@/lib/prisma");
  const body = await request.json();

  const website = await prisma.website.findFirst({
    where: {
      id: body.websiteId,
      domain: body.domain,
    },
    include: {
      user: true,
    },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const count = await prisma.subscriber.count({
    where: { websiteId: website.id },
  });

  if (count >= website.user.subscriberLimit) {
    return NextResponse.json({ error: "Subscriber limit reached" }, { status: 403, headers: CORS_HEADERS });
  }

  const authKey = body.subscription?.keys?.auth;
  const p256dhKey = body.subscription?.keys?.p256dh;
  const endpoint = body.subscription?.endpoint;

  if (!authKey || !p256dhKey || !endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400, headers: CORS_HEADERS });
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

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
