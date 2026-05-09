"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validators";

export async function signupAction(formData: FormData) {
  const { prisma } = await import("@/lib/prisma");

  const payload = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "").toLowerCase(),
    password: String(formData.get("password") || ""),
  };

  const parsed = signupSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid input")}`);
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (exists) {
    redirect("/signup?error=Email%20is%20already%20registered");
  }

  const password = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password,
      subscriberLimit: 1000,
      planType: "FREE",
    },
  });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const verifyUrl = `${getAppUrl()}/api/verify-email?token=${token}`;
  console.log(`Verify email for ${user.email}: ${verifyUrl}`);

  redirect("/login?created=1");
}
