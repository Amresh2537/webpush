import crypto from "crypto";
import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const { prisma } = await import("@/lib/prisma");

  const payload = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || "").toLowerCase(),
    password: String(formData.get("password") || ""),
  };

  const parsed = signupSchema.safeParse(payload);

  if (!parsed.success) {
    const error = encodeURIComponent(parsed.error.issues[0]?.message || "Invalid input");
    return NextResponse.redirect(new URL(`/signup?error=${error}`, request.url), 303);
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (exists) {
    return NextResponse.redirect(new URL("/signup?error=Email%20is%20already%20registered", request.url), 303);
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

  return NextResponse.redirect(new URL("/login?created=1", request.url), 303);
}
