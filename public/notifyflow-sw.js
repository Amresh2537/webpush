self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};

  const title = payload.title || "NotifyFlow";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon.png",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickUrl = event.notification.data?.clickUrl;
  const trackingUrl = event.notification.data?.trackingUrl;

  if (trackingUrl || clickUrl) {
    const finalUrl = trackingUrl || clickUrl;

    event.waitUntil(clients.openWindow(finalUrl));
  }
});
