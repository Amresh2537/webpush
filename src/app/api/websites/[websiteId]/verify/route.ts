import { resolveTxt } from "dns/promises";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

async function verifyMeta(domain: string, token: string) {
  const response = await fetch(domain, { cache: "no-store" });
  const html = await response.text();
  const marker = `<meta name=\"notifyflow-verification\" content=\"${token}\"`;

  return html.includes(marker);
}

async function verifyDns(domain: string, token: string) {
  const hostname = new URL(domain).hostname;
  const records = await resolveTxt(hostname);
  const flat = records.map((record) => record.join(""));

  return flat.some((value) => value.includes(`notifyflow-verification=${token}`));
}

export async function POST(
  request: Request,
  { params }: { params: { websiteId: string } },
) {
  const { prisma } = await import("@/lib/prisma");
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const method = body.method === "DNS" ? "DNS" : "META";

  const website = await prisma.website.findFirst({
    where: {
      id: params.websiteId,
      userId: session.user.id,
    },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  let valid = false;

  try {
    valid = method === "DNS"
      ? await verifyDns(website.domain, website.ownershipToken)
      : await verifyMeta(website.domain, website.ownershipToken);
  } catch (error) {
    console.error("Verification check failed", error);
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 400 });
  }

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Verification token not found" }, { status: 400 });
  }

  await prisma.website.update({
    where: { id: website.id },
    data: {
      isVerified: true,
      verificationMode: method,
    },
  });

  return NextResponse.json({ ok: true });
}
