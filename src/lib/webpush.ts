import webpush from "web-push";
import { getAppUrl } from "@/lib/app-url";

const subject = process.env.VAPID_SUBJECT || "mailto:support@notifyflow.dev";

type PushPayload = {
  title: string;
  message: string;
  iconUrl?: string | null;
  clickUrl: string;
  campaignId: string;
};

export async function sendWebPush(
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subscription: {
    endpoint: string;
    keys: { auth: string; p256dh: string };
  },
  payload: PushPayload,
) {
  const appUrl = getAppUrl();
  webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: payload.iconUrl,
      data: {
        campaignId: payload.campaignId,
        clickUrl: payload.clickUrl,
        trackingUrl: `${appUrl}/api/campaigns/${payload.campaignId}/click`,
      },
    }),
  );
}
