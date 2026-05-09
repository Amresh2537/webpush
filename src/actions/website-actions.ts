"use server";

import crypto from "crypto";
import webpush from "web-push";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { websiteSchema } from "@/lib/validators";

export async function createWebsiteAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const payload = {
    name: String(formData.get("name") || ""),
    domain: String(formData.get("domain") || ""),
    logo: String(formData.get("logo") || ""),
  };

  const parsed = websiteSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/onboarding?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid website data")}`);
  }

  const keys = webpush.generateVAPIDKeys();
  const ownershipToken = crypto.randomBytes(16).toString("hex");

  const website = await prisma.website.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      domain: parsed.data.domain,
      logo: parsed.data.logo || null,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      ownershipToken,
    },
  });

  redirect(`/websites/${website.id}`);
}
