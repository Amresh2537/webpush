import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const appUrl = getAppUrl();
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: {
            interval: "month",
          },
          product_data: {
            name: "NotifyFlow Pro",
            description: "Unlimited subscribers and priority campaign processing",
          },
          unit_amount: 2900,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/dashboard?billing=cancelled`,
  });

  return NextResponse.json({ url: checkout.url });
}
