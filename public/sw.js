const notifyflowConfig = {
  websiteId: "",
  domain: "",
  collectUrl: "",
};

function parseConfigFromUrl() {
  try {
    const url = new URL(self.location.href);
    notifyflowConfig.websiteId = url.searchParams.get("websiteId") || notifyflowConfig.websiteId;
    notifyflowConfig.domain = url.searchParams.get("domain") || notifyflowConfig.domain;
    notifyflowConfig.collectUrl = url.searchParams.get("collectUrl") || notifyflowConfig.collectUrl;
  } catch {
    // Keep defaults when URL parsing fails.
  }
}

function toAbsoluteUrl(url) {
  if (!url) return "";

  try {
    return new URL(url, self.location.origin).toString();
  } catch {
    return "";
  }
}

async function postSubscriptionToCollect(subscription, reason) {
  if (!notifyflowConfig.collectUrl || !notifyflowConfig.websiteId || !notifyflowConfig.domain || !subscription) {
    return;
  }

  try {
    await fetch(notifyflowConfig.collectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        websiteId: notifyflowConfig.websiteId,
        domain: notifyflowConfig.domain,
        subscription,
        browser: (self.navigator && self.navigator.userAgent) || "service-worker",
        pageUrl: self.location.origin,
        location: reason || "subscription-change",
      }),
    });
  } catch {
    // Best-effort sync only.
  }
}

async function openOrFocusClient(url) {
  const absoluteUrl = toAbsoluteUrl(url);

  if (!absoluteUrl) {
    return;
  }

  const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

  for (const client of windowClients) {
    if (client.url === absoluteUrl && "focus" in client) {
      await client.focus();
      return;
    }
  }

  await clients.openWindow(absoluteUrl);
}

parseConfigFromUrl();

self.addEventListener("install", (event) => {
  parseConfigFromUrl();
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  parseConfigFromUrl();
  event.waitUntil(clients.claim());
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "NOTIFYFLOW_CONFIG") {
    return;
  }

  const payload = event.data.payload || {};
  notifyflowConfig.websiteId = payload.websiteId || notifyflowConfig.websiteId;
  notifyflowConfig.domain = payload.domain || notifyflowConfig.domain;
  notifyflowConfig.collectUrl = payload.collectUrl || notifyflowConfig.collectUrl;
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: "NotifyFlow",
      body: event.data ? event.data.text() : "",
    };
  }

  const actions = Array.isArray(payload.actions)
    ? payload.actions.slice(0, 2).map((action, index) => ({
        action: action.action || `action_${index + 1}`,
        title: action.title || `Action ${index + 1}`,
      }))
    : [];

  const title = payload.title || "NotifyFlow";
  const options = {
    body: payload.body || payload.message || "",
    icon: payload.icon || "/icon.png",
    badge: payload.badge,
    image: payload.image,
    tag: payload.tag,
    requireInteraction:
      typeof payload.requireInteraction === "boolean" ? payload.requireInteraction : true,
    actions,
    data: {
      ...(payload.data || {}),
      actionUrls: payload.actionUrls || {},
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldOptions = event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true };
        const subscription = event.newSubscription || (await self.registration.pushManager.subscribe(oldOptions));
        await postSubscriptionToCollect(subscription, "pushsubscriptionchange");
      } catch {
        // Best-effort only.
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const actionUrls = data.actionUrls || {};
  const actionTarget = event.action ? actionUrls[event.action] : "";
  const clickUrl = actionTarget || data.clickUrl || data.url;
  const trackingUrl = data.trackingUrl;

  event.waitUntil(
    (async () => {
      if (trackingUrl) {
        try {
          await fetch(trackingUrl, { method: "GET", keepalive: true });
        } catch {
          // Ignore tracking failures.
        }
      }

      await openOrFocusClient(clickUrl);
    })(),
  );
});
